const { logger } = require('@chainlink/external-adapter')
const hash = require('object-hash')
const LRU = require('lru-cache')
const { v4: uuidv4 } = require('uuid')

const DEFAULT_CACHE_ENABLED = false
const DEFAULT_CACHE_MAX_ITEMS = 500
const DEFAULT_CACHE_MAX_AGE = 1000 * 30 // Maximum age in ms
const DEFAULT_CACHE_UPDATE_AGE_ON_GET = false
const DEFAULT_IGNORED_KEYS = ['id', 'maxAge']

const parseBool = (value) => {
  if (!value) return false
  const _val = value.toString().toLowerCase()
  return (_val === 'true' || _val === 'false') && _val === 'true'
}

// We generate an UUID per instance
const uuid = () => {
  if (!process.env.UUID) process.env.UUID = uuidv4()
  return process.env.UUID
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
  requestCoalescingEnabled:
    parseBool(process.env.REQUEST_COALESCING_ENABLED) || DEFAULT_CACHE_ENABLED,
  requestCoalescingGroup: process.env.REQUEST_COALESCING_GROUP || uuid(),
})

const withCache = (execute, options) => {
  // If no options read the env with sensible defaults
  if (!options) options = envOptions()
  // If disabled noop
  if (!options.enabled) return (data, callback) => execute(data, callback)

  logger.debug('Cache options: ', options)
  const cache = new LRU(options)

  // Algorithm we use to derive entry key
  const hashOptions = {
    algorithm: 'sha1',

    encoding: 'hex',
    excludeKeys: (key) => options.ignoredKeys.includes(key),
  }
  const _getKey = (data) => hash(data, hashOptions)
  const _getCoalescingKey = (key) => hash(`${options.requestCoalescingGroup}--${key}`, hashOptions)

  const _getMaxAge = (data) => {
    if (!data || !data.data) return options.maxAge
    if (isNaN(data.data.maxAge)) return options.maxAge
    return data.data.maxAge || options.maxAge
  }

  const _getWithCoalescing = async (key, coalescingKey, retries = 5, ms = 100) => {
    if (retries === 0) return null
    const entry = cache.get(key)
    if (entry) {
      logger.debug(`Request coalescing: Success`)
      return entry
    }
    const inFlight = cache.get(coalescingKey)
    if (!inFlight) return null
    // Capped linear back-off: 100, 200, 400, 800, 1000..
    ms = Math.min(ms * 2, 1000)
    logger.debug(`Request coalescing: Waiting ${ms}ms`)
    await delay(ms)
    return await _getWithCoalescing(key, coalescingKey, retries - 1, ms)
  }

  return async (data, callback) => {
    const key = _getKey(data)
    const coalescingKey = _getCoalescingKey(key)
    const maxAge = _getMaxAge(data)
    // Add successful result to cache on callback
    const _cacheAndCallback = (statusCode, data) => {
      if (statusCode === 200) {
        const entry = { statusCode, data, maxAge }
        cache.set(key, entry, maxAge)
        logger.debug(`Cache set: ${key} => `, entry)

        // Trigger request coalescing by removing in-flight mark
        cache.del(coalescingKey)
        logger.debug(`Request coalescing: DEL ${coalescingKey}`)
      }
      callback(statusCode, data)
    }

    const entry = options.requestCoalescingEnabled
      ? await _getWithCoalescing(key, coalescingKey)
      : cache.get(key)

    if (entry) {
      if (maxAge >= 0) {
        logger.debug(`Cache hit: ${key} => `, entry)
        return maxAge === entry.maxAge
          ? callback(entry.statusCode, entry.data)
          : _cacheAndCallback(entry.statusCode, entry.data)
      }
      logger.debug(`Cache skip: maxAge < 0`)
    }

    // Initiate request coalescing by adding in-flight mark
    if (options.requestCoalescingEnabled) {
      cache.set(coalescingKey, true, maxAge)
      logger.debug(`Request coalescing: SET ${coalescingKey}`)
    }

    execute(data, _cacheAndCallback)
  }
}

module.exports = {
  withCache,
  envOptions,
}
