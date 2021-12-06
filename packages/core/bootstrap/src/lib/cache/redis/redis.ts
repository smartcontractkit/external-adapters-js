import { timeout, TimeoutError } from 'promise-timeout'
import { createClient } from 'redis'
// Node Redis is having issues with type exports in v4: https://github.com/redis/node-redis/issues/1673
// The following is a workaround for now (TODO import from 'redis' and remove these dependencies)
import { RedisClientOptions } from '@node-redis/client/dist/lib/client' //TODO add RedisClientType here
import { RedisModules, RedisScripts } from '@node-redis/client/dist/lib/commands'
import { logger } from '../../external-adapter'
import { CacheEntry } from '../types'
import * as metrics from './metrics'

const DEFAULT_CACHE_REDIS_HOST = '127.0.0.1' // IP address of the Redis server
const DEFAULT_CACHE_REDIS_PORT = 6379 // Port of the Redis server
const DEFAULT_CACHE_REDIS_PATH = undefined // The UNIX socket string of the Redis server
const DEFAULT_CACHE_REDIS_URL = undefined // The URL of the Redis server
const DEFAULT_CACHE_REDIS_PASSWORD = undefined // The password required for redis auth
const DEFAULT_CACHE_REDIS_CONNECTION_TIMEOUT = 15 * 1000 // Timeout per long lived connection (ms)
const DEFAULT_CACHE_REDIS_MAX_RECONNECT_COOLDOWN = 3 * 1000 // Max cooldown time before attempting to reconnect (ms)
const DEFAULT_CACHE_REDIS_REQUEST_TIMEOUT = 500 // Timeout per request (ms)
const DEFAULT_CACHE_MAX_AGE = 90 * 1000 // 1.5 minutes
const DEFAULT_CACHE_REDIS_MAX_QUEUED_ITEMS = 100 // Maximum length of the client's internal command queue

const env = process.env

export type RedisOptions = RedisClientOptions<RedisModules, RedisScripts> & {
  maxAge: number
  timeout: number
  type: 'redis'
}

export const defaultOptions = (): RedisOptions => ({
  type: 'redis',
  socket: {
    host: env.CACHE_REDIS_HOST || DEFAULT_CACHE_REDIS_HOST,
    port: Number(env.CACHE_REDIS_PORT) || DEFAULT_CACHE_REDIS_PORT,
    path: env.CACHE_REDIS_PATH || DEFAULT_CACHE_REDIS_PATH,
    reconnectStrategy: (retries: number): number => {
      metrics.redis_retries_count.inc()
      logger.warn(`Redis reconnect attempt #${retries}`)
      return Math.min(
        retries * 100,
        Number(env.CACHE_REDIS_MAX_RECONNECT_COOLDOWN) ||
          DEFAULT_CACHE_REDIS_MAX_RECONNECT_COOLDOWN,
      ) // Next reconnect attempt time
    },
    connectTimeout:
      Number(env.CACHE_REDIS_CONNECTION_TIMEOUT) || DEFAULT_CACHE_REDIS_CONNECTION_TIMEOUT,
  },
  url: env.CACHE_REDIS_URL || DEFAULT_CACHE_REDIS_URL,
  password: env.CACHE_REDIS_PASSWORD || DEFAULT_CACHE_REDIS_PASSWORD,
  commandsQueueMaxLength:
    Number(env.CACHE_REDIS_MAX_QUEUED_ITEMS) || DEFAULT_CACHE_REDIS_MAX_QUEUED_ITEMS,
  maxAge: Number(env.CACHE_MAX_AGE) || DEFAULT_CACHE_MAX_AGE,
  timeout: Number(env.CACHE_REDIS_TIMEOUT) || DEFAULT_CACHE_REDIS_REQUEST_TIMEOUT,
})

// Options without sensitive data
export const redactOptions = (opts: RedisOptions) => {
  if (opts.password) opts.password = opts.password.replace(/.+/g, '*****')
  if (opts.url) opts.url = opts.url.replace(/:\/\/.+@/g, '://*****@')
  return opts
}

export class RedisCache {
  options: RedisOptions
  client: any //TODO use RedisClientType with some modifications?
  watchdog?: ReturnType<typeof setInterval>

  constructor(options: RedisOptions) {
    logger.info('Creating new redis client instance...')

    this.options = options
    const client = createClient(options as RedisClientOptions<RedisModules, RedisScripts>)
    client.on('error', (err) => logger.error(`Error connecting to Redis: ${err}`))
    client.on('end', () => logger.error('Redis connection ended.'))
    client.on('connect', () => logger.info('Initiating connection to Redis server.'))
    client.on('ready', () =>
      logger.info('Redis client ready to serve requests, queued requests will be replayed'),
    )
    client.on('reconnecting', () => logger.info('Attempting to reconnect to Redis server.'))
    this.client = client
  }

  static async build(options: RedisOptions) {
    metrics.redis_connections_open.inc()
    const cache = new RedisCache(options)
    await cache.client.connect()
    return cache
  }

  async setResponse(key: string, value: CacheEntry, maxAge: number) {
    const entry = JSON.stringify(value)
    return await this.contextualTimeout(this.client.set(key, entry, { PX: maxAge }), 'set', {
      key,
      value,
      maxAge,
    })
  }

  // TODO: We should have seperate services for response entries, and coalescing support
  async setFlightMarker(key: string, maxAge: number) {
    return this.contextualTimeout(this.client.set(key, true, { PX: maxAge }), 'set', {
      key,
      maxAge,
    })
  }

  async getResponse(key: string): Promise<CacheEntry | undefined> {
    const entry: string = await this.contextualTimeout(this.client.get(key), 'get', { key })
    return JSON.parse(entry)
  }

  async getFlightMarker(key: string): Promise<boolean> {
    const entry: string = await this.contextualTimeout(this.client.get(key), 'get', { key })

    return JSON.parse(entry)
  }

  async del(key: string) {
    return this.contextualTimeout(this.client.del(key), 'del', { key })
  }

  async ttl(key: string): Promise<number> {
    // TTL in ms
    return this.contextualTimeout(this.client.pTTL(key), 'ttl', { key })
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
      const res = await this.contextualTimeout(this.client.quit(), 'close', {
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
      metrics.redis_commands_sent_count
        .labels({ status: metrics.CMD_SENT_STATUS.SUCCESS, function_name: fnName })
        .inc()
      return result
    } catch (e) {
      if (e instanceof TimeoutError) {
        logger.error(
          `Redis method timed out, consider increasing CACHE_REDIS_TIMEOUT (from ${this.options.timeout} ms) or increasing your redis instance performance`,
          { fnName, context },
        )
        throw e
      }
      logger.error('Redis method error', { fnName, context, e })
      metrics.redis_commands_sent_count
        .labels({
          status: metrics.CMD_SENT_STATUS.FAIL,
          function_name: fnName,
        })
        .inc()
      throw e
    }
  }
}
