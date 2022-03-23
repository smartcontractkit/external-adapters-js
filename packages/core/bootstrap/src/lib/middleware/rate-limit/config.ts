import { getRateLimit, getHTTPLimit, Limits } from '../../config/provider-limits'
import { getEnv, parseBool } from '../../util'
import { logger } from '../../modules'
import { AdapterContext } from '@chainlink/types'

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

export function get(
  rateLimitConfig: { limits: Limits; name: string } = { limits: { http: {}, ws: {} }, name: '' },
  context: AdapterContext,
): Config {
  const enabled =
    parseBool(getEnv('CACHE_ENABLED', undefined, context)) &&
    parseBool(getEnv('RATE_LIMIT_ENABLED'))
  let capacity = parseInt(getEnv('RATE_LIMIT_CAPACITY') || '')
  const perSecRateLimit = getEnv('RATE_LIMIT_CAPACITY_SECOND')
  const perMinuteRateLimit = getEnv('RATE_LIMIT_CAPACITY_MINUTE')
  const shouldIgnorePerSecLimit = perSecRateLimit && parseInt(perSecRateLimit) <= 0
  const shouldIgnorePerMinLimit = perMinuteRateLimit && parseInt(perMinuteRateLimit) <= 0
  if (perSecRateLimit) capacity = shouldIgnorePerSecLimit ? 0 : parseInt(perSecRateLimit)
  if (perMinuteRateLimit) capacity = shouldIgnorePerMinLimit ? 0 : parseInt(perMinuteRateLimit)
  if (!capacity && enabled) {
    const tier = getEnv('RATE_LIMIT_API_TIER') || ''
    try {
      const providerConfig = getRateLimit(rateLimitConfig.name, rateLimitConfig.limits, tier)
      capacity = Number(providerConfig.minute)
    } catch (e) {
      logger.error(e.message)
    }
  }
  let burstCapacity1s = 0
  let burstCapacity1m = 0
  if (enabled) {
    const tier = getEnv('RATE_LIMIT_API_TIER') || ''
    try {
      const limit = getHTTPLimit(rateLimitConfig.name, rateLimitConfig.limits, tier, 'rateLimit1s')
      burstCapacity1s = shouldIgnorePerSecLimit ? 0 : Number(limit)
    } catch {
      // Ignore
    }
    try {
      const limit = getHTTPLimit(rateLimitConfig.name, rateLimitConfig.limits, tier, 'rateLimit1m')
      burstCapacity1m = shouldIgnorePerMinLimit ? 0 : Number(limit)
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
