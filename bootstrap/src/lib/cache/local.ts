import LRU from 'lru-cache'
import { parseBool } from '../util'

// Options
const DEFAULT_CACHE_MAX_ITEMS = 500
const DEFAULT_CACHE_MAX_AGE = 1000 * 30 // Maximum age in ms
const DEFAULT_CACHE_UPDATE_AGE_ON_GET = false
const DEFAULT_CACHE_TIMEOUT = 500 // Timeout in ms

const env = process.env
export const defaultOptions = () => ({
  max: Number(env.CACHE_MAX_ITEMS) || DEFAULT_CACHE_MAX_ITEMS,
  maxAge: Number(env.CACHE_MAX_AGE) || DEFAULT_CACHE_MAX_AGE,
  updateAgeOnGet: parseBool(env.CACHE_UPDATE_AGE_ON_GET) || DEFAULT_CACHE_UPDATE_AGE_ON_GET,
  timeout: DEFAULT_CACHE_TIMEOUT,
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

  close() {
    // noop
  }
}
