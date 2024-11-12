import { logger } from '../../modules/logger'
import { AdapterConfigError } from '../../modules/error'

export const DEFAULT_MINUTE_RATE_LIMIT = 60
export const BURST_UNDEFINED_QUOTA_MULTIPLE = 2

export const DEFAULT_WS_CONNECTIONS = 2
export const DEFAULT_WS_SUBSCRIPTIONS = 10

export type RateLimitTimeFrame = 'rateLimit1s' | 'rateLimit1m' | 'rateLimit1h'

type HTTPTier = {
  rateLimit1s?: number
  rateLimit1m?: number
  rateLimit1h?: number
  note?: string
}

type WSTier = {
  connections: number
  subscriptions: number
}

export interface Limits {
  http: {
    [tierName: string]: HTTPTier
  }
  ws: {
    [tierName: string]: WSTier
  }
}

export interface RateLimitConfig {
  limits: Limits
  name: string
}

interface ProviderRateLimit {
  second: number
  minute: number
}

export const getHTTPLimit = (
  provider: string,
  limits: Limits,
  tier: string,
  timeframe: RateLimitTimeFrame,
): number => {
  const providerLimit = getProviderLimits(provider, limits, tier, 'http')
  return (providerLimit as HTTPTier)?.[timeframe] || 0
}

export const getRateLimit = (provider: string, limits: Limits, tier: string): ProviderRateLimit => {
  const providerLimit = getProviderLimits(provider, limits, tier, 'http')
  return calculateRateLimit(providerLimit as HTTPTier)
}

export const getWSLimits = (provider: string, limits: Limits, tier: string): WSTier => {
  const providerLimit = getProviderLimits(provider, limits, tier, 'ws')
  return calculateWSLimits(providerLimit as WSTier)
}

const getProviderLimits = (
  provider: string,
  limits: Limits,
  tier: string,
  protocol: 'ws' | 'http',
): HTTPTier | WSTier | undefined => {
  const providerConfig = parseLimits(limits)
  if (!providerConfig)
    throw new AdapterConfigError({
      message: `Rate Limit: Provider: "${provider}" doesn't match any provider spec in limits.json`,
    })

  const protocolConfig = providerConfig[protocol]
  if (!protocolConfig)
    throw new AdapterConfigError({
      message: `Rate Limit: "${provider}" doesn't have any configuration for ${protocol} in limits.json`,
    })

  let limitsConfig = protocolConfig[tier.toLowerCase()]

  if (!limitsConfig) {
    logger.debug(
      `Rate Limit: "${provider} does not have tier ${tier} defined. Falling back to lowest tier"`,
    )
    limitsConfig = Object.values(protocolConfig)?.[0]
  }

  if (!limitsConfig)
    throw new AdapterConfigError({
      message: `Rate Limit: Provider: "${provider}" has no tiers defined for ${protocol} in limits.json`,
    })

  return limitsConfig
}

const parseLimits = (limits: Limits): Limits => {
  const lowercase = (o: Limits['ws'] | Limits['http']) =>
    Object.fromEntries(
      Object.entries(o).map((entry) => {
        const [tierName, rest] = entry
        return [tierName.toLowerCase(), { ...rest }]
      }),
    )
  const http = lowercase(limits.http)
  const ws = lowercase(limits?.ws)
  return { http, ws }
}

export function getLastTierLimitValue(
  limits: Limits,
  protocol: 'ws' | 'http',
  rateLimit: string,
): number {
  if (Object.keys(limits).length == 0) return 0
  const protocolConfig = limits[protocol]
  const tiers = Object.keys(limits[protocol])
  let highestValue = 0
  for (const tierIndex in tiers) {
    const tierName = tiers[tierIndex]
    const rateLimitValue = protocolConfig[tierName][rateLimit as keyof HTTPTier & keyof WSTier]
    if (rateLimitValue > highestValue) {
      highestValue = rateLimitValue
    }
  }
  return highestValue
}

const calculateWSLimits = (providerLimit: WSTier): WSTier => {
  return {
    connections: providerLimit.connections,
    subscriptions: providerLimit.subscriptions,
  }
}

const calculateRateLimit = (providerLimit: HTTPTier): ProviderRateLimit => {
  let quota = providerLimit.rateLimit1m
  if (!quota && providerLimit?.rateLimit1h) {
    quota = providerLimit?.rateLimit1h / 60
  } else if (!quota && providerLimit?.rateLimit1s) {
    quota = providerLimit?.rateLimit1s * 60
  }
  return {
    second: providerLimit?.rateLimit1s || ((quota as number) / 60) * BURST_UNDEFINED_QUOTA_MULTIPLE,
    minute: quota as number,
  }
}
