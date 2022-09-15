import { getRateLimit, getHTTPLimit, Limits } from '../../config/provider-limits'
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

export function getLastTierLimit(rateLimitConfig: RateLimitConfig): string | undefined {
  const { limits } = rateLimitConfig
  let lastTier: string
  if (Object.keys(limits).length == 0) return undefined
  const tierList = Object.keys(limits.http)
  if (tierList.length !== 0) {
    lastTier = tierList[tierList.length - 1]
    return limits.http[lastTier] as string
  }
  return undefined
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
  let lastTier: string | undefined = undefined

  if (!capacity && enabled) {
    lastTier = getLastTierLimit(rateLimitConfig)
  }

  if (perSecRateLimit) {
    capacity = shouldIgnorePerSecLimit ? 0 : parseInt(perSecRateLimit)
    if (lastTier)
      highestTierLimit = shouldIgnorePerSecLimit
        ? 0
        : (rateLimitConfig.limits.http[lastTier].rateLimit1m as number)
  }

  if (perMinuteRateLimit) {
    capacity = shouldIgnorePerMinLimit ? 0 : parseInt(perMinuteRateLimit)
    if (lastTier)
      highestTierLimit = shouldIgnorePerSecLimit
        ? 0
        : (rateLimitConfig.limits.http[lastTier].rateLimit1m as number)
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
