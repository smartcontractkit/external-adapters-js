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

const cacheOptions = {
  max: Number(process.env.CACHE_MAX_ITEMS) || DEFAULT_CACHE_MAX_ITEMS,
  maxAge: Number(process.env.CACHE_MAX_AGE) || DEFAULT_CACHE_MAX_AGE,
  updateAgeOnGet: parseBool(process.env.CACHE_UPDATE_AGE_ON_GET) || DEFAULT_CACHE_UPDATE_AGE_ON_GET,
  ignoredKeys: [
    ...DEFAULT_IGNORED_KEYS,
    ...(process.env.CACHE_IGNORED_KEYS || '').split(',').filter((k) => k), // no empty keys
  ],
}
const cache = new LRU(cacheOptions)

const hashOptions = {
  algorithm: 'sha1',
  encoding: 'hex',
  excludeKeys: (key) => cacheOptions.ignoredKeys.includes(key),
}

const getMaxAge = (data) => {
  if (!data || !data.data) return cacheOptions.maxAge
  if (isNaN(data.data.maxAge)) return cacheOptions.maxAge
  return data.data.maxAge || cacheOptions.maxAge
}

const withCache = (execute) => (data, callback) => {
  const key = hash(data, hashOptions)
  const maxAge = getMaxAge(data)
  // Add successful result to cache on callback
  const _cacheAndCallback = (statusCode, data) => {
    if (statusCode === 200) {
      const entry = { statusCode, data, maxAge }
      cache.set(key, entry, maxAge)
      console.log(`Cache set: ${key} => `, entry)
    }
    callback(statusCode, data)
  }

  if (cache.has(key)) {
    const entry = cache.get(key)
    if (maxAge >= 0) {
      console.log(`Cache hit: ${key} => `, entry)
      return maxAge === entry.maxAge
        ? callback(entry.statusCode, entry.data)
        : _cacheAndCallback(entry.statusCode, entry.data)
    }
    console.log(`Cache skip: maxAge < 0`)
  }

  execute(data, _cacheAndCallback)
}

const withCacheNoop = (execute) => (data, callback) => execute(data, callback)

const enabled = parseBool(process.env.CACHE_ENABLED) || DEFAULT_CACHE_ENABLED
if (enabled) console.log('Cache enabled: ', cacheOptions)

module.exports = {
  withCache: enabled ? withCache : withCacheNoop,
}
