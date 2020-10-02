const { logger } = require('@chainlink/external-adapter')
const hash = require('object-hash')
const local = require('./local')
const redis = require('./redis')
const { parseBool, uuid, delay, exponentialBackOffMs, getWithCoalescing } = require('../util')

const DEFAULT_CACHE_ENABLED = false
const DEFAULT_CACHE_TYPE = 'local'
const DEFAULT_CACHE_KEY_GROUP = uuid()
const DEFAULT_CACHE_KEY_IGNORED_PROPS = ['id', 'maxAge']
// Request coalescing
const DEFAULT_RC_ENABLED = true
const DEFAULT_RC_INTERVAL = 100
const DEFAULT_RC_INTERVAL_MAX = 1000
const DEFAULT_RC_INTERVAL_COEFFICIENT = 2
const DEFAULT_RC_ENTROPY_MAX = 0

const env = process.env
const envOptions = () => ({
  enabled: parseBool(env.CACHE_ENABLED) || DEFAULT_CACHE_ENABLED,
  type: env.CACHE_TYPE || DEFAULT_CACHE_TYPE,
  local: local.envOptions(),
  redis: redis.envOptions(),
  key: {
    group: env.CACHE_KEY_GROUP || DEFAULT_CACHE_KEY_GROUP,
    ignored: [
      ...DEFAULT_CACHE_KEY_IGNORED_PROPS,
      ...(env.CACHE_KEY_IGNORED_PROPS || '').split(',').filter((k) => k), // no empty keys
    ],
  },
  // Request coalescing
  requestCoalescing: {
    enabled: parseBool(env.REQUEST_COALESCING_ENABLED) || DEFAULT_RC_ENABLED,
    // Capped linear back-off: 100, 200, 400, 800, 1000..
    interval: Number(env.REQUEST_COALESCING_INTERVAL) || DEFAULT_RC_INTERVAL,
    intervalMax: Number(env.REQUEST_COALESCING_INTERVAL_MAX) || DEFAULT_RC_INTERVAL_MAX,
    intervalCoefficient:
      Number(env.REQUEST_COALESCING_INTERVAL_COEFFICIENT) || DEFAULT_RC_INTERVAL_COEFFICIENT,
    // Add entropy to absorb bursts
    entropyMax: Number(env.REQUEST_COALESCING_ENTROPY_MAX) || DEFAULT_RC_ENTROPY_MAX,
  },
})

const getCacheImpl = (options) => {
  switch (options.type) {
    case 'redis':
      return redis.RedisCache.build(options.redis)

    default:
      return new local.LocalLRUCache(options.local)
  }
}

const withCache = async (execute, options) => {
  // If no options read the env with sensible defaults
  if (!options) options = envOptions()
  // If disabled noop
  if (!options.enabled) return (data) => execute(data)

  const cache = await getCacheImpl(options)

  // Algorithm we use to derive entry key
  const hashOptions = {
    algorithm: 'sha1',
    encoding: 'hex',
    excludeKeys: (props) => options.key.ignored.includes(props),
  }

  const _getKey = (data) => `${options.key.group}:${hash(data, hashOptions)}`
  const _getCoalescingKey = (key) => `inFlight:${key}`
  const _setInFlightMarker = async (key, maxAge) => {
    if (!options.requestCoalescing.enabled) return
    await cache.set(key, true, maxAge)
    logger.debug(`Request coalescing: SET ${key}`)
  }
  const _delInFlightMarker = async (key) => {
    if (!options.requestCoalescing.enabled) return
    await cache.del(key)
    logger.debug(`Request coalescing: DEL ${key}`)
  }

  const _getMaxAge = (data) => {
    if (!data || !data.data) return cache.options.maxAge
    if (isNaN(data.data.maxAge)) return cache.options.maxAge
    return data.data.maxAge || cache.options.maxAge
  }

  return async (data) => {
    const key = _getKey(data)
    const coalescingKey = _getCoalescingKey(key)
    const maxAge = _getMaxAge(data)
    // Add successful result to cache
    const _cacheOnSuccess = async ({ statusCode, data }) => {
      if (statusCode === 200) {
        const entry = { statusCode, data, maxAge }
        await cache.set(key, entry, maxAge)
        logger.debug(`Cache: SET ${key}`, entry)
        // Notify pending requests by removing the in-flight mark
        await _delInFlightMarker(coalescingKey)
      }
    }

    const _getWithCoalescing = () =>
      getWithCoalescing({
        get: async (retryCount) => {
          const entry = await cache.get(key)
          if (entry) logger.debug(`Request coalescing: GET on retry #${retryCount}`)
          return entry
        },
        isInFlight: async (retryCount) => {
          if (retryCount === 1 && options.requestCoalescing.entropyMax) {
            // Add some entropy here because of possible scenario where the key won't be set before multiple
            // other instances in a burst request try to access the coalescing key.
            const randomMs = Math.random() * options.requestCoalescing.entropyMax
            await delay(randomMs)
          }
          const inFlight = await cache.get(coalescingKey)
          logger.debug(`Request coalescing: CHECK inFlight:${!!inFlight} on retry #${retryCount}`)
          return inFlight
        },
        retries: 5,
        interval: (retryCount) =>
          exponentialBackOffMs(
            retryCount,
            options.requestCoalescing.interval,
            options.requestCoalescing.intervalMax,
            options.requestCoalescing.intervalCoefficient,
          ),
      })

    const entry = options.requestCoalescing.enabled
      ? await _getWithCoalescing()
      : await cache.get(key)

    if (entry) {
      if (maxAge >= 0) {
        logger.debug(`Cache: GET ${key}`, entry)
        if (maxAge !== entry.maxAge) _cacheOnSuccess(entry)
        return entry
      }
      logger.debug(`Cache: SKIP(maxAge < 0)`)
    }

    // Initiate request coalescing by adding the in-flight mark
    await _setInFlightMarker(coalescingKey, maxAge)

    const result = await execute(data)
    _cacheOnSuccess(result)
    return result
  }
}

module.exports = {
  withCache,
  envOptions,
}
