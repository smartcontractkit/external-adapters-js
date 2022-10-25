import {
  getRateLimit,
  getHTTPLimit,
  RateLimitConfig,
  getLastTierLimitValue,
} from '../../config/provider-limits'
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
    highestTierLimit = getLastTierLimitValue(rateLimitConfig.limits, 'http', 'rateLimit1s')
  }

  if (perMinuteRateLimit) {
    capacity = shouldIgnorePerMinLimit ? 0 : parseInt(perMinuteRateLimit)
    highestTierLimit = getLastTierLimitValue(rateLimitConfig.limits, 'http', 'rateLimit1m')
  }

  if (enabled && capacity > highestTierLimit) {
    logger.warn(
      `The configured ${
        perMinuteRateLimit
          ? 'RATE_LIMIT_CAPACITY_MINUTE'
          : perSecRateLimit
          ? 'RATE_LIMIT_CAPACITY_SECOND'
          : 'RATE_LIMIT_CAPACITY'
      } value ${capacity} is higher than the highest tier value from limits.json ${highestTierLimit}`,
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
