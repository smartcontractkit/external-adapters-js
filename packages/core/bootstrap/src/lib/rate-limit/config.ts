import { getRateLimit, getHTTPLimit } from '../provider-limits'
import { getEnv, parseBool } from '../util'
import { logger } from '../external-adapter'
import { AdapterContext } from '@chainlink/types'
import { DEFAULT_CACHE_ENABLED } from '../cache'

export const DEFAULT_RATE_LIMIT_ENABLED = true

export interface Config {
  /**
   * The time to live on a subscription, if no new requests come in that do not
   * originate from the warm up engine itself
   */
  burstCapacity1s: number
  burstCapacity1m: number
  totalCapacity: number

  /**
   * Determines if Rate Limit option is activated
   */
  enabled: boolean
}

export function get(context: AdapterContext): Config {
  const enabled =
    parseBool(getEnv('CACHE_ENABLED') ?? DEFAULT_CACHE_ENABLED) &&
    parseBool(getEnv('RATE_LIMIT_ENABLED') ?? DEFAULT_RATE_LIMIT_ENABLED)
  let capacity = parseInt(getEnv('RATE_LIMIT_CAPACITY') || '')
  if (!capacity && enabled) {
    const provider = getEnv('RATE_LIMIT_API_PROVIDER') || context.name?.toLowerCase() || ''
    const tier = getEnv('RATE_LIMIT_API_TIER') || ''
    try {
      const providerConfig = getRateLimit(provider, tier)
      capacity = Number(providerConfig.minute)
    } catch (e) {
      logger.error(e.message)
    }
  }
  let burstCapacity1s = 0
  let burstCapacity1m = 0
  if (enabled) {
    const provider = getEnv('RATE_LIMIT_API_PROVIDER') || context.name?.toLowerCase() || ''
    const tier = getEnv('RATE_LIMIT_API_TIER') || ''
    try {
      const limit = getHTTPLimit(provider, tier, 'rateLimit1s')
      burstCapacity1s = Number(limit)
    } catch {
      // Ignore
    }
    try {
      const limit = getHTTPLimit(provider, tier, 'rateLimit1m')
      burstCapacity1m = Number(limit)
    } catch {
      // Ignore
    }
  }
  return {
    burstCapacity1s,
    burstCapacity1m,
    totalCapacity: capacity,
    enabled: enabled && !!capacity,
  }
}
