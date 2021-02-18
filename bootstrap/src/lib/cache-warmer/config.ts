import objectHash from 'object-hash'

// bootstrap/src/lib/cache
const DEFAULT_CACHE_KEY_IGNORED_PROPS = ['id', 'maxAge', 'meta']

export interface Config {
  /**
   * The time to live (TTL) in milliseconds of a warm up request. This number gets reset every single time
   * a request comes in from the adapter, if it ever is allowed to expire, it means we should send
   * a warm up response to the external adapter
   */
  ttl: number

  /**
   * Hashing options for differentiating requests
   */
  hashOpts: Required<Parameters<typeof objectHash>>['1']
}

export function get(): Config {
  return {
    hashOpts: {
      algorithm: 'sha1',
      encoding: 'hex',
      excludeKeys: (props: string) => DEFAULT_CACHE_KEY_IGNORED_PROPS.includes(props),
    },
    ttl: 10_000,
  }
}
