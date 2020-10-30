const LRU = require('lru-cache')
const { parseBool } = require('../util')

// Options
const DEFAULT_CACHE_MAX_ITEMS = 500
const DEFAULT_CACHE_MAX_AGE = 1000 * 30 // Maximum age in ms
const DEFAULT_CACHE_UPDATE_AGE_ON_GET = false

const env = process.env
const defaultOptions = () => ({
  max: Number(env.CACHE_MAX_ITEMS) || DEFAULT_CACHE_MAX_ITEMS,
  maxAge: Number(env.CACHE_MAX_AGE) || DEFAULT_CACHE_MAX_AGE,
  updateAgeOnGet: parseBool(env.CACHE_UPDATE_AGE_ON_GET) || DEFAULT_CACHE_UPDATE_AGE_ON_GET,
})
// Options without sensitive data
const redactOptions = (opts) => opts

class LocalLRUCache {
  constructor(options) {
    this.options = options
    this.client = new LRU(options)
  }

  set(key, value, maxAge) {
    return this.client.set(key, value, maxAge)
  }

  get(key) {
    return this.client.get(key)
  }

  del(key) {
    return this.client.del(key)
  }

  close() {
    // noop
  }
}

module.exports = {
  LocalLRUCache,
  defaultOptions,
  redactOptions,
}
