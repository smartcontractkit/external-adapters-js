import { timeout, TimeoutError } from 'promise-timeout'
import { ClientOpts, createClient, RedisClient } from 'redis'
import { promisify } from 'util'
import { logger } from '../external-adapter'
import { redis_connections_open } from './metrics'

// Connection
const DEFAULT_CACHE_REDIS_HOST = '127.0.0.1' // IP address of the Redis server
const DEFAULT_CACHE_REDIS_PORT = 6379 // Port of the Redis server
const DEFAULT_CACHE_REDIS_PATH = undefined // The UNIX socket string of the Redis server
const DEFAULT_CACHE_REDIS_URL = undefined // The URL of the Redis server
const DEFAULT_CACHE_REDIS_PASSWORD = undefined // The password required for redis auth
const DEFAULT_CACHE_REDIS_TIMEOUT = 500 // Timeout in ms
// Options
const DEFAULT_CACHE_MAX_AGE = 1000 * 60 * 2 // 2 minutes

const env = process.env

export type RedisOptions = ClientOpts & { maxAge: number; timeout: number }

export const defaultOptions = (): RedisOptions => ({
  host: env.CACHE_REDIS_HOST || DEFAULT_CACHE_REDIS_HOST,
  port: Number(env.CACHE_REDIS_PORT) || DEFAULT_CACHE_REDIS_PORT,
  path: env.CACHE_REDIS_PATH || DEFAULT_CACHE_REDIS_PATH,
  url: env.CACHE_REDIS_URL || DEFAULT_CACHE_REDIS_URL,
  password: env.CACHE_REDIS_PASSWORD || DEFAULT_CACHE_REDIS_PASSWORD,
  maxAge: Number(env.CACHE_MAX_AGE) || DEFAULT_CACHE_MAX_AGE,
  timeout: Number(env.CACHE_REDIS_TIMEOUT) || DEFAULT_CACHE_REDIS_TIMEOUT,
})

// Options without sensitive data
export const redactOptions = (opts: RedisOptions) => {
  if (opts.password) opts.password = opts.password.replace(/.+/g, '*****')
  if (opts.url) opts.url = opts.url.replace(/:\/\/.+@/g, '://*****@')
  return opts
}

const retryStrategy = (options: any) => {
  logger.warn('Redis retry strategy activated.', options)
  if (options.error && options.error.code === 'ECONNREFUSED') {
    // End reconnecting on a specific error and flush all commands with
    // a individual error
    return new Error('The server refused the connection')
  }
  if (options.total_retry_time > 1000 * 60 * 60) {
    // End reconnecting after a specific timeout and flush all commands
    // with a individual error
    return new Error('Retry time exhausted')
  }
  if (options.attempt > 10) {
    // End reconnecting with built in error
    return undefined
  }
  // reconnect after
  return Math.min(options.attempt * 100, 3000)
}

export class RedisCache {
  options: RedisOptions
  client: RedisClient
  _auth: any
  _get: any
  _set: any
  _del: any
  _quit: any
  _pttl: any

  constructor(options: RedisOptions) {
    this.options = options
    const client = createClient({ ...options, retry_strategy: retryStrategy })
    client.on('error', (err) => logger.error('Error connecting to Redis. ', err))
    client.on('end', () => logger.error('Redis connection ended.'))

    this._auth = promisify(client.auth).bind(client)
    this._get = promisify(client.get).bind(client)
    this._set = promisify(client.set).bind(client)
    this._del = promisify(client.del).bind(client)
    this._quit = promisify(client.quit).bind(client)
    this._pttl = promisify(client.pttl).bind(client)
    this.client = client
  }

  private async connect() {
    if (!this.options.password) return
    return this.contextualTimeout(this._auth(this.options.password), 'connect', {
      includedPassword: !!this.options.password,
    })
  }

  static async build(options: RedisOptions) {
    logger.info('Creating new redis client instance...')
    redis_connections_open.inc()
    const cache = new RedisCache(options)
    await cache.connect()
    return cache
  }

  async set(key: string, value: any, maxAge: number) {
    const entry = JSON.stringify(value)
    return this.contextualTimeout(this._set(key, entry, 'PX', maxAge), 'set', {
      key,
      value,
      maxAge,
    })
  }

  async get(key: string) {
    const entry: string = await this.contextualTimeout(this._get(key), 'get', { key })
    return JSON.parse(entry)
  }

  async del(key: string) {
    return this.contextualTimeout(this._del(key), 'del', { key })
  }

  async ttl(key: string) {
    // TTL in ms
    return this.contextualTimeout(this._pttl(key), 'ttl', { key })
  }

  /**
   * Forcibly close the connection to the Redis server.
   *
   * AWS Lambda will timeout if the connection is not closed, because the connection
   * keeps the event loop busy.
   *
   * The alternative is to use: `context.callbackWaitsForEmtpyEventLoop = false`
   */
  async close() {
    if (!this.client) return

    try {
      // No further commands will be processed
      const res = await this.contextualTimeout(this._quit(), 'close', {
        clientExists: !!this.client,
      })
      logger.debug(`Redis connection shutdown completed with: ${res}`)
    } finally {
      this.client.removeAllListeners()
    }
  }

  async contextualTimeout(promise: Promise<any>, fnName: string, context: any) {
    try {
      const result = await timeout(promise, this.options.timeout)
      return result
    } catch (e) {
      if (e instanceof TimeoutError) {
        logger.error(
          'Redis method timed out, consider increasing CACHE_REDIS_TIMEOUT or increasing your redis instance performance',
          { fnName, context },
        )
        throw e
      }
      logger.error('Redis method error', { fnName, context })
      throw e
    }
  }
}
