import objectHash from 'object-hash'
import { getHashOpts } from '../util'

export interface Config {
  /**
   * The time to live on a subscription, if no new requests come in that do not
   * originate from the warm up engine itself
   */
  totalCapacity: number

  /**
   * Hashing options for differentiating requests
   */
  hashOpts: Required<Parameters<typeof objectHash>>['1']
}

export function get(): Config {
  return {
    hashOpts: getHashOpts(),
    totalCapacity: parseInt(process.env.RATE_LIMIT_CAPACITY || ''),
  }
}
