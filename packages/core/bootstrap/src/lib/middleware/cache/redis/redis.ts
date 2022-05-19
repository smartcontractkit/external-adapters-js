import { timeout, TimeoutError } from 'promise-timeout'
import { createClient } from 'redis'
// TODO https://app.shortcut.com/chainlinklabs/story/23811/update-redis-client-types-and-imports
import { RedisClientOptions } from '@node-redis/client/dist/lib/client' //TODO add RedisClientType here
import { RedisModules, RedisScripts } from '@node-redis/client/dist/lib/commands'
import { logger } from '../../../modules'
import { CacheEntry } from '../types'
import * as metrics from './metrics'
import { getEnv } from '../../../util'

export type RedisOptions = RedisClientOptions<RedisModules, RedisScripts> & {
  maxAge: number
  timeout: number
  type: 'redis'
}

export const defaultOptions = (): RedisOptions => {
  const options: RedisOptions = {
    type: 'redis',
    socket: {
      host: getEnv('CACHE_REDIS_HOST'),
      port: Number(getEnv('CACHE_REDIS_PORT')),
      path: getEnv('CACHE_REDIS_PATH'),
      reconnectStrategy: (retries: number): number => {
        metrics.redis_retries_count.inc()
        logger.warn(`Redis reconnect attempt #${retries}`)
        return Math.min(retries * 100, Number(getEnv('CACHE_REDIS_MAX_RECONNECT_COOLDOWN'))) // Next reconnect attempt time
      },
      connectTimeout: Number(getEnv('CACHE_REDIS_CONNECTION_TIMEOUT')),
    },
    password: getEnv('CACHE_REDIS_PASSWORD'),
    commandsQueueMaxLength: Number(getEnv('CACHE_REDIS_MAX_QUEUED_ITEMS')),
    maxAge: Number(getEnv('CACHE_MAX_AGE')),
    timeout: Number(getEnv('CACHE_REDIS_TIMEOUT')),
  }
  const cacheRedisURL = getEnv('CACHE_REDIS_URL')
  if (cacheRedisURL) options.url = cacheRedisURL
  return options
}

// Options without sensitive data
export const redactOptions = (opts: RedisOptions): RedisOptions => {
  if (opts.password) opts.password = opts.password.replace(/.+/g, '*****')
  if (opts.url) opts.url = opts.url.replace(/:\/\/.+@/g, '://*****@')
  return opts
}

export class RedisCache {
  options: RedisOptions
  client: any //TODO https://app.shortcut.com/chainlinklabs/story/23811/update-redis-client-types-and-imports

  constructor(options: RedisOptions) {
    logger.info('Creating new redis client instance...')

    this.options = options
    const client = createClient(options as RedisClientOptions)
    client.on('error', (err) => logger.error(`[Redis client] Error connecting to Redis: ${err}`))
    client.on('end', () => logger.error('[Redis client] Connection ended.'))
    client.on('connect', () => logger.info('[Redis client] Initiating connection to Redis server.'))
    client.on('ready', () =>
      logger.info('[Redis client] Ready to serve requests, queued requests will be replayed'),
    )
    client.on('reconnecting', () =>
      logger.info('[Redis client] Attempting to reconnect to Redis server.'),
    )
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
    return await this.contextualTimeout(
      this.client.set(key, entry, { PX: maxAge }),
      'setResponse',
      {
        key,
        value,
        maxAge,
      },
    )
  }

  async setFlightMarker(key: string, maxAge: number) {
    return this.contextualTimeout(this.client.set(key, 'true', { PX: maxAge }), 'setFlightMarker', {
      key,
      maxAge,
    })
  }

  async getResponse(key: string): Promise<CacheEntry | undefined> {
    const entry: string = await this.contextualTimeout(this.client.get(key), 'getResponse', { key })
    return JSON.parse(entry)
  }

  async getFlightMarker(key: string): Promise<boolean> {
    const entry: string = await this.contextualTimeout(this.client.get(key), 'getFlightMarker', {
      key,
    })

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
  async close(): Promise<void> {
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

  async contextualTimeout(promise: Promise<any>, fnName: string, context: Record<string, any>) {
    try {
      const result = await timeout(promise, this.options.timeout)
      metrics.redis_commands_sent_count
        .labels({ status: metrics.CMD_SENT_STATUS.SUCCESS, function_name: fnName })
        .inc()
      return result
    } catch (e) {
      if (e instanceof TimeoutError) {
        logger.error(
          `[Redis] Method timed out, consider increasing CACHE_REDIS_TIMEOUT (from ${this.options.timeout} ms) or increasing your resource allocation`,
          { fnName, context },
        )
        metrics.redis_commands_sent_count
          .labels({
            status: metrics.CMD_SENT_STATUS.TIMEOUT,
            function_name: fnName,
          })
          .inc()
        throw e
      }
      logger.error(`[Redis] Method ${fnName} errored: \n${JSON.stringify(context)}\n${e}`)
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
