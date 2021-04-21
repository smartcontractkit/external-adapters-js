import objectHash from 'object-hash'
import { getRateLimit } from '../provider-limits'
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
    try {
      const providerConfig = getRateLimit(provider, tier)
      capacity = Number(providerConfig.minute)
    } catch (e) {
      logger.error(e.message)
    }
  }
  return {
    hashOpts: getHashOpts(),
    totalCapacity: capacity,
    enabled: enabled && !!capacity,
  }
}
