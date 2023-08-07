import type { AdapterResponse } from '../../../types'
import type * as local from './local'
import type * as redis from './redis'

export interface ICache {
  setResponse(key: string, value: boolean | CacheEntry, maxAge: number): void
  setFlightMarker(key: string, maxAge: number): void
  getResponse(key: string): void
  getFlightMarker(key: string): void
  del(key: string): void
  ttl(key: string): void
  close(): void
}
export interface CacheEntry
  extends Pick<
    AdapterResponse,
    'statusCode' | 'data' | 'result' | 'debug' | 'telemetry' | 'providerStatusCode'
  > {
  maxAge: number
}

export type Cache = redis.RedisCache | local.LocalLRUCache

export type CacheImplOptions = local.LocalOptions | redis.RedisOptions

export interface CacheOptions {
  instance?: Cache
  enabled: boolean
  cacheImplOptions: local.LocalOptions | redis.RedisOptions
  cacheBuilder: (options: CacheImplOptions) => Promise<redis.RedisCache | local.LocalLRUCache>
  key: {
    group: string
  }
  requestCoalescing: {
    enabled: boolean
    interval: number
    intervalMax: number
    intervalCoefficient: number
    entropyMax: number
    maxRetries: number
  }
  minimumAge: number
}
