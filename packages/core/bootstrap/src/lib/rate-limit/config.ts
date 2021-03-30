import objectHash from 'object-hash'
import { getRateLimit } from '@chainlink/ea-ratelimits'
import { getHashOpts, getEnv, parseBool } from '../util'
import { logger } from '../external-adapter'

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

  /**
   * Determines if Rate Limit option is activated
   */
  enabled: boolean
}

export function get(): Config {
  const enabled = parseBool(getEnv('EXPERIMENTAL_RATE_LIMIT_ENABLED'))
  let capacity = parseInt(getEnv('RATE_LIMIT_CAPACITY') || '')
  if (!capacity && enabled) {
    const provider = getEnv('RATE_LIMIT_API_PROVIDER') || ''
    const tier = getEnv('RATE_LIMIT_API_TIER') || ''
    const providerConfig = getRateLimit(provider, tier)
    capacity = Number(providerConfig?.quota)
    if (!capacity) {
      logger.warn('Rate Limit: Feature is enabled, but no capacity specified')
    }
  }
  return {
    hashOpts: getHashOpts(),
    totalCapacity: capacity,
    enabled: enabled && !!capacity,
  }
}
