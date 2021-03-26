import objectHash from 'object-hash'
import { getHashOpts, getEnv } from '../util'
import { getRateLimit } from '@chainlink/ea-ratelimits'

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
  const capacity = parseInt(getEnv('RATE_LIMIT_CAPACITY') || '')
  const provider = getEnv('API_PROVIDER') || ''
  const tier = parseInt(getEnv('API_TIER') || '')
  const providerConfig = getRateLimit(provider, tier)
  return {
    hashOpts: getHashOpts(),
    totalCapacity: capacity || providerConfig?.quota,
  }
}
