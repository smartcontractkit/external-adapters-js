const { logger } = require('@chainlink/external-adapter')
const hash = require('object-hash')
const LRU = require('lru-cache')
const {
  toAsync,
  parseBool,
  uuid,
  delay,
  exponentialBackOffMs,
  getWithCoalescing,
} = require('./util')

const DEFAULT_CACHE_ENABLED = false
const DEFAULT_CACHE_MAX_ITEMS = 500
const DEFAULT_CACHE_MAX_AGE = 1000 * 30 // Maximum age in ms
const DEFAULT_CACHE_UPDATE_AGE_ON_GET = false
const DEFAULT_IGNORED_KEYS = ['id', 'maxAge']

const envOptions = () => ({
  enabled: parseBool(process.env.CACHE_ENABLED) || DEFAULT_CACHE_ENABLED,
  max: Number(process.env.CACHE_MAX_ITEMS) || DEFAULT_CACHE_MAX_ITEMS,
  maxAge: Number(process.env.CACHE_MAX_AGE) || DEFAULT_CACHE_MAX_AGE,
  updateAgeOnGet: parseBool(process.env.CACHE_UPDATE_AGE_ON_GET) || DEFAULT_CACHE_UPDATE_AGE_ON_GET,
  ignoredKeys: [
    ...DEFAULT_IGNORED_KEYS,
    ...(process.env.CACHE_IGNORED_KEYS || '').split(',').filter((k) => k), // no empty keys
  ],
  // Request coalescing
  requestCoalescing: {
    enabled: parseBool(process.env.REQUEST_COALESCING_ENABLED) || DEFAULT_CACHE_ENABLED,
    group: process.env.REQUEST_COALESCING_GROUP || uuid(),
    // Capped linear back-off: 100, 200, 400, 800, 1000..
    intervalMin: process.env.REQUEST_COALESCING_INTERVAL_MIN || 100,
    intervalMax: process.env.REQUEST_COALESCING_INTERVAL_MAX || 1000,
    intervalCoefficient: process.env.REQUEST_COALESCING_INTERVAL_COEFFICIENT || 2,
    // Add entropy to absorb bursts
    entropyMax: process.env.REQUEST_COALESCING_ENTROPY_MAX || 0,
  },
})

const withCache = (execute, options) => {
  // If no options read the env with sensible defaults
  if (!options) options = envOptions()
  // If disabled noop
  if (!options.enabled) return async (data) => await toAsync(execute, data)

  const cache = new LRU(options)

  // Algorithm we use to derive entry key
  const hashOptions = {
    algorithm: 'sha1',
    encoding: 'hex',
    excludeKeys: (key) => options.ignoredKeys.includes(key),
  }

  const _getKey = (data) => hash(data, hashOptions)
  const _getCoalescingKey = (key) => hash(`${options.requestCoalescing.group}--${key}`, hashOptions)
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
    if (!data || !data.data) return options.maxAge
    if (isNaN(data.data.maxAge)) return options.maxAge
    return data.data.maxAge || options.maxAge
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
        logger.debug(`Cache: SET ${key} => `, entry)
        // Trigger request coalescing by removing in-flight mark
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
          if (retryCount === 1) {
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
            options.requestCoalescing.min,
            options.requestCoalescing.max,
            options.requestCoalescing.coefficient,
          ),
      })

    const entry = options.requestCoalescing.enabled
      ? await _getWithCoalescing()
      : await cache.get(key)

    if (entry) {
      if (maxAge >= 0) {
        logger.debug(`Cache: GET ${key} => `, entry)
        if (maxAge !== entry.maxAge) _cacheOnSuccess(entry)
        return entry
      }
      logger.debug(`Cache: SKIP(maxAge < 0)`)
    }

    // Initiate request coalescing by adding in-flight mark
    await _setInFlightMarker(coalescingKey, maxAge)

    const result = await toAsync(execute, data)
    _cacheOnSuccess(result)
    return result
  }
}

module.exports = {
  withCache,
  envOptions,
}
