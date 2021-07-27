import { getRateLimit } from '../provider-limits'
import { getEnv, parseBool } from '../util'
import { logger } from '../external-adapter'
import { AdapterContext } from '@chainlink/types'

export interface Config {
  /**
   * The time to live on a subscription, if no new requests come in that do not
   * originate from the warm up engine itself
   */
  totalCapacity: number

  /**
   * Determines if Rate Limit option is activated
   */
  enabled: boolean
}

export function get(context: AdapterContext): Config {
  const enabled = parseBool(getEnv('EXPERIMENTAL_RATE_LIMIT_ENABLED'))
  let capacity = parseInt(getEnv('RATE_LIMIT_CAPACITY') || '')
  if (!capacity && enabled) {
    const provider = getEnv('RATE_LIMIT_API_PROVIDER') || context.name || ''
    const tier = getEnv('RATE_LIMIT_API_TIER') || ''
    try {
      const providerConfig = getRateLimit(provider, tier)
      capacity = Number(providerConfig.minute)
    } catch (e) {
      logger.error(e.message)
    }
  }
  return {
    totalCapacity: capacity,
    enabled: enabled && !!capacity,
  }
}
