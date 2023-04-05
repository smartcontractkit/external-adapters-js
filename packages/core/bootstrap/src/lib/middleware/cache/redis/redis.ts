import { timeout, TimeoutError } from 'promise-timeout'
import {
  createClient,
  RedisModules,
  RedisScripts,
  RedisClientType,
  RedisClientOptions,
  RedisFunctions,
} from 'redis'
import { logger } from '../../../modules/logger'
import type { ICache, CacheEntry } from '../types'
import * as metrics from './metrics'
import { getEnv } from '../../../util'

export type RedisOptions = RedisClientOptions<RedisModules, RedisFunctions, RedisScripts> & {
  maxAge: number
  timeout: number
  type: 'redis'
}

const MAX_REDIS_CONNECTION_TIMEOUT = 60000

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
      connectTimeout: Math.min(
        Number(getEnv('CACHE_REDIS_CONNECTION_TIMEOUT')),
        MAX_REDIS_CONNECTION_TIMEOUT,
      ),
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

export class RedisCache implements ICache {
  options: RedisOptions
  client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>
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

  static async build(options: RedisOptions): Promise<RedisCache> {
    metrics.redis_connections_open.inc()
    const cache = new RedisCache(options)
    await cache.client.connect()
    return cache
  }

  async setResponse(key: string, value: CacheEntry, maxAge: number): Promise<string | null> {
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

  async setBatchResponse(batchEntries: { key: string; entry: CacheEntry; maxAge: number }[]) {
    const pipelineQue: Promise<string | null>[] = []

    batchEntries.forEach((batchParticipant) => {
      const entry = JSON.stringify(batchParticipant.entry)
      const cacheResponse = this.client.set(batchParticipant.key, entry, {
        PX: batchParticipant.maxAge,
      })
      pipelineQue.push(cacheResponse)
    })

    try {
      await Promise.all(pipelineQue)
      metrics.redis_commands_sent_count
        .labels({ status: metrics.CMD_SENT_STATUS.SUCCESS, function_name: 'setBatchResponse' })
        .inc()
    } catch (e) {
      metrics.redis_commands_sent_count
        .labels({ status: metrics.CMD_SENT_STATUS.FAIL, function_name: 'setBatchResponse' })
        .inc()
      throw e
    }
  }

  async setFlightMarker(key: string, maxAge: number): Promise<string | null> {
    return this.contextualTimeout(this.client.set(key, 'true', { PX: maxAge }), 'setFlightMarker', {
      key,
      maxAge,
    })
  }

  async getResponse(key: string): Promise<CacheEntry | undefined> {
    const entry = await this.contextualTimeout(this.client.get(key), 'getResponse', { key })
    if (!entry) return
    return JSON.parse(entry)
  }

  async getFlightMarker(key: string): Promise<boolean> {
    const entry = await this.contextualTimeout(this.client.get(key), 'getFlightMarker', {
      key,
    })
    if (!entry) return false
    return !!JSON.parse(entry)
  }

  async del(key: string): Promise<number> {
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

  async contextualTimeout<ReturnType>(
    promise: Promise<ReturnType>,
    fnName: string,
    context: Record<string, unknown>,
  ): Promise<ReturnType> {
    try {
      const result = await timeout(promise, this.options.timeout)
      metrics.redis_commands_sent_count
        .labels({ status: metrics.CMD_SENT_STATUS.SUCCESS, function_name: fnName })
        .inc()
      return result
    } catch (e: any) {
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
