import LRU from 'lru-cache'

// Extended from https://github.com/isaacs/node-lru-cache/blob/main/index.js#L169

interface CacheItem {
  value: {
    now: number
    maxAge: number
    value: unknown
    length: number
  }
}

export interface LRUInterface<K, V> extends LRU<K, V> {
  cache: Map<string, CacheItem>
}
