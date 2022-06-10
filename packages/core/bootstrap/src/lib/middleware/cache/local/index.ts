import LRU from 'lru-cache'
import type { LRUInterface } from './types'
import { getEnv, parseBool } from '../../../util'
import type { ICache, CacheEntry } from '../types'

export interface LocalOptions {
  type: 'local'
  max: number
  maxAge: number
  updateAgeOnGet: boolean
}
export const defaultOptions = (): LocalOptions =>
  ({
    type: 'local',
    max: Number(getEnv('CACHE_MAX_ITEMS')),
    maxAge: Number(getEnv('CACHE_MAX_AGE')),
    updateAgeOnGet: parseBool(getEnv('CACHE_UPDATE_AGE_ON_GET')),
  } as const)
// Options without sensitive data
export const redactOptions = (opts: CacheOptions): CacheOptions => opts

type CacheOptions = Omit<
  LRU.Options<string, CacheEntry | boolean>,
  'max' | 'maxAge' | 'updateAgeOnGet'
> &
  ReturnType<typeof defaultOptions>

export class LocalLRUCache implements ICache {
  options: CacheOptions
  client: LRUInterface<string, CacheEntry | boolean>
  static cacheInstance: LocalLRUCache

  static getInstance(options: CacheOptions): LocalLRUCache {
    if (!LocalLRUCache.cacheInstance) {
      this.cacheInstance = new LocalLRUCache(options)
    }
    return this.cacheInstance
  }

  constructor(options: CacheOptions) {
    this.options = options
    this.client = new LRU(options) as LRUInterface<string, CacheEntry | boolean>
  }

  setResponse(key: string, value: boolean | CacheEntry, maxAge: number): boolean {
    this.client.set(key, value, { ttl: maxAge })
    return true
  }

  setFlightMarker(key: string, maxAge: number): boolean {
    this.client.set(key, true, { ttl: maxAge })
    return true
  }

  async getResponse(key: string): Promise<CacheEntry | undefined> {
    return this.client.get(key)
  }

  async getFlightMarker(key: string): Promise<boolean> {
    return this.client.get(key) as boolean
  }

  del(key: string): void {
    this.client.delete(key)
  }

  ttl(key: string): number {
    return this.client.getRemainingTTL(key)
  }

  close(): void {
    // noop
  }
}
