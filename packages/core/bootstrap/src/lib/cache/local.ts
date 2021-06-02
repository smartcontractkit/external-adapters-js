import LRU from 'lru-cache'
import { parseBool } from '../util'

// Options
const DEFAULT_CACHE_MAX_ITEMS = 500
const DEFAULT_CACHE_MAX_AGE = 1000 * 60 * 2 // 2 minutes
const DEFAULT_CACHE_UPDATE_AGE_ON_GET = false

const env = process.env
export const defaultOptions = () => ({
  max: Number(env.CACHE_MAX_ITEMS) || DEFAULT_CACHE_MAX_ITEMS,
  maxAge: Number(env.CACHE_MAX_AGE) || DEFAULT_CACHE_MAX_AGE,
  updateAgeOnGet: parseBool(env.CACHE_UPDATE_AGE_ON_GET) || DEFAULT_CACHE_UPDATE_AGE_ON_GET,
})
// Options without sensitive data
export const redactOptions = (opts: any) => opts

export class LocalLRUCache {
  options: LRU.Options<unknown, unknown>
  client: LRU<unknown, unknown>

  constructor(options: LRU.Options<unknown, unknown>) {
    this.options = options
    this.client = new LRU(options)
  }

  set(key: string, value: any, maxAge: number) {
    return this.client.set(key, value, maxAge)
  }

  get(key: string) {
    return this.client.get(key)
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
