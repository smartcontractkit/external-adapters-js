const { logger } = require('@chainlink/external-adapter')
const hash = require('object-hash')
const LRU = require('lru-cache')

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

const envOptions = () => ({
  enabled: parseBool(process.env.CACHE_ENABLED) || DEFAULT_CACHE_ENABLED,
  max: Number(process.env.CACHE_MAX_ITEMS) || DEFAULT_CACHE_MAX_ITEMS,
  maxAge: Number(process.env.CACHE_MAX_AGE) || DEFAULT_CACHE_MAX_AGE,
  updateAgeOnGet: parseBool(process.env.CACHE_UPDATE_AGE_ON_GET) || DEFAULT_CACHE_UPDATE_AGE_ON_GET,
  ignoredKeys: [
    ...DEFAULT_IGNORED_KEYS,
    ...(process.env.CACHE_IGNORED_KEYS || '').split(',').filter((k) => k), // no empty keys
  ],
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

  const _getMaxAge = (data) => {
    if (!data || !data.data) return options.maxAge
    if (isNaN(data.data.maxAge)) return options.maxAge
    return data.data.maxAge || options.maxAge
  }

  return (data, callback) => {
    const key = hash(data, hashOptions)
    const maxAge = _getMaxAge(data)
    // Add successful result to cache on callback
    const _cacheAndCallback = (statusCode, data) => {
      if (statusCode === 200) {
        const entry = { statusCode, data, maxAge }
        cache.set(key, entry, maxAge)
        logger.debug(`Cache set: ${key} => `, entry)
      }
      callback(statusCode, data)
    }

    if (cache.has(key)) {
      const entry = cache.get(key)
      if (maxAge >= 0) {
        logger.debug(`Cache hit: ${key} => `, entry)
        return maxAge === entry.maxAge
          ? callback(entry.statusCode, entry.data)
          : _cacheAndCallback(entry.statusCode, entry.data)
      }
      logger.debug(`Cache skip: maxAge < 0`)
    }

    execute(data, _cacheAndCallback)
  }
}

module.exports = {
  withCache,
  envOptions,
}
