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

  setResponse(key: string, value: any, maxAge: number) {
    return this.client.set(key, value, maxAge)
  }

  setBatchResponse(batchEntries: { key: string; entry: CacheEntry; maxAge: number }[]) {
    batchEntries.forEach((batchParticipant) => {
      this.client.set(batchParticipant.key, batchParticipant.entry, batchParticipant.maxAge)
    })
  }

  setFlightMarker(key: string, maxAge: number) {
    return this.client.set(key, true, maxAge)
  }

  async getResponse(key: string): Promise<CacheEntry | undefined> {
    return this.client.get(key) as CacheEntry | undefined
  }

  async getFlightMarker(key: string): Promise<boolean> {
    return this.client.get(key) as boolean
  }

  del(key: string) {
    return this.client.del(key)
  }

  ttl(key: string) {
    // Get LRU internal 'cache' symbol
    const _isCacheSymbol = (sym: symbol) => sym.toString().includes('cache')
    const cacheSymbol = Object.getOwnPropertySymbols(this.client).find(_isCacheSymbol)
    if (!cacheSymbol) return 0

    // Get raw LRU entry
    const cacheMap: Map<any, any> = (this.client as any)[cacheSymbol]
    const hit = cacheMap.get(key)
    if (!hit) return 0

    // Return ttl >= 0
    const ttl = hit.value?.now + (hit.value?.maxAge || 0) - Date.now()
    return ttl < 0 ? 0 : ttl
  }

  close() {
    // noop
  }
}
