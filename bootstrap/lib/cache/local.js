const LRU = require('lru-cache')
const { parseBool } = require('../util')

const DEFAULT_CACHE_MAX_ITEMS = 500
const DEFAULT_CACHE_MAX_AGE = 1000 * 30 // Maximum age in ms
const DEFAULT_CACHE_UPDATE_AGE_ON_GET = false

const env = process.env
const envOptions = () => ({
  max: Number(env.CACHE_MAX_ITEMS) || DEFAULT_CACHE_MAX_ITEMS,
  maxAge: Number(env.CACHE_MAX_AGE) || DEFAULT_CACHE_MAX_AGE,
  updateAgeOnGet: parseBool(env.CACHE_UPDATE_AGE_ON_GET) || DEFAULT_CACHE_UPDATE_AGE_ON_GET,
})

module.exports = {
  Cache: LRU,
  envOptions,
}
