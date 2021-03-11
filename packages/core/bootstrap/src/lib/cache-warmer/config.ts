import objectHash from 'object-hash'

export interface Config {
  /**
   * The interval in milliseconds which the warm-up engine will execute
   * the underlying external adapter to update its cache
   */
  warmupInterval: number
  /**
   * The number of errors that can consecutively occur
   * before a warmup subscription for a particular request
   * is cancelled
   */
  unhealthyThreshold: number

  /**
   * The time to live on a subscription, if no new requests come in that do not
   * originate from the warm up engine itself
   */
  subscriptionTTL: number

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
      excludeKeys: (props: string) =>
        ['id', 'maxAge', 'meta']
          .concat((process.env.CACHE_KEY_IGNORED_PROPS || '').split(',').filter((k) => k))
          .includes(props),
    },
    unhealthyThreshold: Number(process.env.WARMUP_UNHEALTHY_THRESHOLD) || 3,
    warmupInterval: (Number(process.env.CACHE_MAX_AGE) || 30_000) / 2,
    subscriptionTTL: Number(process.env.WARMUP_SUBSCRIPTION_TTL) || 60 * 1000 * 60, // default 1h
  }
}
