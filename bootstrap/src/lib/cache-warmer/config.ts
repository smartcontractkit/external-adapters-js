import objectHash from 'object-hash'

// bootstrap/src/lib/cache
const DEFAULT_CACHE_KEY_IGNORED_PROPS = ['id', 'maxAge', 'meta']

export interface Config {
  warmupInterval: number

  /**
   * The number of errors that can consecutively occur
   * before a warmup subscription for a particular request
   * is cancelled
   */
  unhealthyThreshold: number

  /**
   * Hashing options for differentiating requests
   */
  hashOpts: Required<Parameters<typeof objectHash>>['1']
}

// TOOD: allow these to be configured :D
export function get(): Config {
  return {
    hashOpts: {
      algorithm: 'sha1',
      encoding: 'hex',
      excludeKeys: (props: string) => DEFAULT_CACHE_KEY_IGNORED_PROPS.includes(props),
    },
    unhealthyThreshold: 3,
    warmupInterval: 10_000,
  }
}
