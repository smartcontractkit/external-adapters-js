import objectHash from 'object-hash'
import { getHashOpts } from '../util'

export const WARMUP_REQUEST_ID = '9001'
export const WARMUP_BATCH_REQUEST_ID = '9002'

export interface Config {
  /**
   * The interval in milliseconds which the warm-up engine will execute
   * the underlying external adapter to update its cache. If left empty
   * should calculate the interval based on the TTL of each request.
   */
  warmupInterval?: number

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
    hashOpts: getHashOpts(),
    unhealthyThreshold: Number(process.env.WARMUP_UNHEALTHY_THRESHOLD) || 3,
    warmupInterval: Number(process.env.WARMUP_INTERVAL),
    subscriptionTTL: Number(process.env.WARMUP_SUBSCRIPTION_TTL) || 60 * 1000 * 60, // default 1h
  }
}
