import { getRateLimit, getHTTPLimit, Limits, HTTPTier } from '../../config/provider-limits'
import { getEnv, parseBool, logError } from '../../util'
import { AdapterError } from '../../modules/error'
import type { AdapterContext } from '../../../types'
import { logger } from '../../modules/logger'

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

export interface RateLimitConfig {
  limits: Limits
  name: string
}

export function getLastTierLimit(
  rateLimitConfig: RateLimitConfig,
  rateLimit: keyof HTTPTier,
): number {
  const { limits } = rateLimitConfig
  if (Object.keys(limits).length == 0) return 0
  const tierList = Object.keys(limits.http)
  if (tierList.length !== 0) {
    const lastTier = tierList[tierList.length - 1]
    const highestTierLimit = rateLimitConfig.limits.http[lastTier][rateLimit] as number
    return highestTierLimit
  }
  return 0
}

export function get(
  rateLimitConfig: RateLimitConfig = { limits: { http: {}, ws: {} }, name: '' },
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
  let highestTierLimit = 0

  if (perSecRateLimit) {
    capacity = shouldIgnorePerSecLimit ? 0 : parseInt(perSecRateLimit)
    highestTierLimit = getLastTierLimit(rateLimitConfig, 'rateLimit1s')
  }

  if (perMinuteRateLimit) {
    capacity = shouldIgnorePerMinLimit ? 0 : parseInt(perMinuteRateLimit)
    highestTierLimit = getLastTierLimit(rateLimitConfig, 'rateLimit1m')
  }

  if (enabled && capacity > highestTierLimit) {
    logger.warn(
      `The configured RATE_LIMIT_CAPACITY value is higher than the highest tier value from limits.json`,
    )
  }

  if (!capacity && enabled) {
    const tier = getEnv('RATE_LIMIT_API_TIER') || ''
    try {
      const providerConfig = getRateLimit(rateLimitConfig.name, rateLimitConfig.limits, tier)
      capacity = Number(providerConfig.minute)
    } catch (e) {
      logError(new AdapterError(e as Partial<AdapterError>))
    }
  }
  let burstCapacity1s = 0
  let burstCapacity1m = 0
  if (enabled) {
    const tier = getEnv('RATE_LIMIT_API_TIER') || ''
    try {
      const limit = getHTTPLimit(rateLimitConfig.name, rateLimitConfig.limits, tier, 'rateLimit1s')
      burstCapacity1s = shouldIgnorePerSecLimit ? 0 : Number(limit)
    } catch (e) {
      logError(new AdapterError(e as Partial<AdapterError>))
    }
    try {
      const limit = getHTTPLimit(rateLimitConfig.name, rateLimitConfig.limits, tier, 'rateLimit1m')
      burstCapacity1m = shouldIgnorePerMinLimit ? 0 : Number(limit)
    } catch (e) {
      logError(new AdapterError(e as Partial<AdapterError>))
    }
  }

  return {
    burstCapacity1s,
    burstCapacity1m,
    totalCapacity: capacity,
    enabled: enabled && !!capacity,
  }
}
