import LRU from 'lru-cache'
import { parseBool } from '../util'
import { CacheEntry } from './types'

// Options
const DEFAULT_CACHE_MAX_ITEMS = 500
const DEFAULT_CACHE_MAX_AGE = 1000 * 60 * 2 // 2 minutes
const DEFAULT_CACHE_UPDATE_AGE_ON_GET = false

const env = process.env
export interface LocalOptions {
  type: 'local'
  max: number
  maxAge: number
  updateAgeOnGet: boolean
}
export const defaultOptions = (): LocalOptions =>
  ({
    type: 'local',
    max: Number(env.CACHE_MAX_ITEMS) || DEFAULT_CACHE_MAX_ITEMS,
    maxAge: Number(env.CACHE_MAX_AGE) || DEFAULT_CACHE_MAX_AGE,
    updateAgeOnGet: parseBool(env.CACHE_UPDATE_AGE_ON_GET) || DEFAULT_CACHE_UPDATE_AGE_ON_GET,
  } as const)
// Options without sensitive data
export const redactOptions = (opts: any) => opts

type CacheOptions = Omit<
  LRU.Options<string, CacheEntry | boolean>,
  'max' | 'maxAge' | 'updateAgeOnGet'
> &
  ReturnType<typeof defaultOptions>
export class LocalLRUCache {
  options: CacheOptions
  client: LRU<string, CacheEntry | boolean>

  constructor(options: CacheOptions) {
    this.options = options
    this.client = new LRU(options)
  }

  setResponse(key: string, value: any, maxAge: number) {
    return this.client.set(key, value, maxAge)
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
