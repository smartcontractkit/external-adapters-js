const { promisify } = require('util')
const redis = require('redis')

// Connection
const DEFAULT_CACHE_REDIS_HOST = '127.0.0.1' // IP address of the Redis server
const DEFAULT_CACHE_REDIS_PORT = 6379 // Port of the Redis server
const DEFAULT_CACHE_REDIS_PATH = null // The UNIX socket string of the Redis server
const DEFAULT_CACHE_REDIS_URL = null // The URL of the Redis server
const DEFAULT_CACHE_REDIS_PASSWORD = null // The password required for redis auth
// Options
const DEFAULT_CACHE_MAX_AGE = 1000 * 30 // Maximum age in ms

const env = process.env
const envOptions = () => ({
  host: env.CACHE_REDIS_HOST || DEFAULT_CACHE_REDIS_HOST,
  port: env.CACHE_REDIS_PORT || DEFAULT_CACHE_REDIS_PORT,
  path: env.CACHE_REDIS_PATH || DEFAULT_CACHE_REDIS_PATH,
  url: env.CACHE_REDIS_URL || DEFAULT_CACHE_REDIS_URL,
  password: env.CACHE_REDIS_PASSWORD || DEFAULT_CACHE_REDIS_PASSWORD,
  maxAge: Number(env.CACHE_MAX_AGE) || DEFAULT_CACHE_MAX_AGE,
})

// TODO: reconnections and error handling
class RedisCache {
  constructor(options) {
    this.options = options
    const client = redis.createClient(options)
    this._auth = promisify(client.auth).bind(client)
    this._get = promisify(client.get).bind(client)
    this._set = promisify(client.set).bind(client)
    this._del = promisify(client.del).bind(client)
    this.client = client
  }

  async connect() {
    if (!this.options.password) return
    await this._auth(this.options.password)
  }

  static async build(options) {
    const cache = new RedisCache(options)
    await cache.connect()
    return cache
  }

  async set(key, value, maxAge) {
    const entry = JSON.stringify(value)
    return await this._set(key, entry, 'PX', maxAge)
  }

  async get(key) {
    const entry = await this._get(key)
    return JSON.parse(entry)
  }

  async del(key) {
    return await this._del(key)
  }
}

module.exports = {
  RedisCache,
  envOptions,
}
