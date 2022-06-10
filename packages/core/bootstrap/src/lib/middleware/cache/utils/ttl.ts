import { logger } from '../../../modules'
import type { AdapterRequestWithRateLimit } from '../../../../types'
import { defaultOptions } from '..'
import type { CacheOptions } from '../types'

export const WARNING_MAX_AGE = 1000 * 60 * 2 // 2 minutes

export const getRateLimitMaxAge = (
  adapterRequest: AdapterRequestWithRateLimit,
  options: CacheOptions = defaultOptions(),
): number | undefined => {
  if (!adapterRequest || !adapterRequest.rateLimitMaxAge) return
  if (isNaN(adapterRequest.rateLimitMaxAge)) return
  const feedId = adapterRequest?.metricsMeta?.feedId
  const maxAge = adapterRequest.rateLimitMaxAge
  if (maxAge > WARNING_MAX_AGE)
    logger.trace(
      `${feedId && feedId[0] !== '{' ? `[${feedId}]` : ''} Cache: High data staleness - TTL of ${
        maxAge / 1000 / 60
      } minutes`,
      adapterRequest,
    )
  if (maxAge > options.cacheImplOptions.maxAge) {
    logger.warn(
      `${
        feedId && feedId[0] !== '{' ? `[${feedId}]` : ''
      } Cache: Calculated TTL exceeds maximum TTL, using maximum of ${
        options.cacheImplOptions.maxAge / 1000 / 60
      } minutes`,
      adapterRequest,
    )
    return options.cacheImplOptions.maxAge
  }
  return maxAge
}

export const getMaxAgeOverride = (
  adapterRequest: AdapterRequestWithRateLimit,
): number | undefined => {
  if (!adapterRequest || !adapterRequest.data || !adapterRequest.data.maxAge) return
  if (isNaN(adapterRequest.data.maxAge)) return
  return adapterRequest.data.maxAge
}

export const getTTL = (
  adapterRequest: AdapterRequestWithRateLimit,
  options: CacheOptions = defaultOptions(),
): number => {
  const TTL = getMaxAgeOverride(adapterRequest) || getRateLimitMaxAge(adapterRequest)
  if (!TTL || TTL < options.minimumAge) return options.minimumAge
  return TTL
}
