import { logger } from '../external-adapter'
import limits from './limits.json'

export const DEFAULT_MINUTE_RATE_LIMIT = 60 
export const BURST_UNDEFINED_QUOTA_MULTIPLE = 2

export const DEFAULT_WS_CONNECTIONS = 2
export const DEFAULT_WS_SUBSCRIPTIONS = 10

type HTTPTier = {
  rateLimit1s?: number
  rateLimit1m?: number
  rateLimit1h?: number
}

type WSTier = {
  connections: number
  subscriptions: number
}

interface Limits {
  [providerName: string]: {
    http: {
      [tierName: string]: HTTPTier
    }
    ws: {
      [tierName: string]: WSTier
    }
  }
}

interface ProviderRateLimit {
  second: number
  minute: number
}

export const getRateLimit = (
  provider: string,
  tier: string,
): ProviderRateLimit => {
  const providerLimit = getProviderLimits(provider, tier, 'http')
  if (!providerLimit) {
    logger.info(`Rate Limit: Provider: "${provider}" and Tier: "${tier}" doesn't match any provider spec in limits.json`)
  }
  return calculateRateLimit(providerLimit as HTTPTier)
}

export const getWSLimits = (
  provider: string,
  tier: string,
): WSTier => {
  const providerLimit = getProviderLimits(provider, tier, 'ws')
  if (!providerLimit) {
    logger.info(`WS Limit: Provider: "${provider}" and Tier: "${tier}" doesn't match any provider spec in limits.json`)
  }
  return calculateWSLimits(providerLimit as WSTier)
}

const getProviderLimits = (provider: string, tier: string, protocol: string): HTTPTier | WSTier | undefined => {
  const parsedLimits = parseLimits(limits)
  const providerLimit = parsedLimits[provider.toLowerCase()]
  return protocol === 'http' ? providerLimit?.http[tier.toLowerCase()] : providerLimit?.ws[tier.toLowerCase()]
}

const parseLimits = (limits: any): Limits => {
  const _mapObject = (fn: any) => (o: any) => Object.fromEntries(Object.entries(o).map(fn))
  const _formatProtocol = _mapObject(((entry: any[]) => {
    const [tierName, rest] = entry
    return [tierName.toLowerCase(), { ...rest as any }]
  }))
  const _formatProvider = _mapObject((entry: any[]) => {
    const [providerName, protocol] = entry
    const http = _formatProtocol(protocol?.http)
    const ws = _formatProtocol(protocol?.ws)
    return [providerName.toLowerCase(), { http, ws }]
  })
  return _formatProvider(limits)
}

const calculateWSLimits = (providerLimit?: WSTier): WSTier => {
  return {
    connections: providerLimit?.connections || DEFAULT_WS_CONNECTIONS,
    subscriptions: providerLimit?.subscriptions || DEFAULT_WS_SUBSCRIPTIONS,
  }
}

const calculateRateLimit = (providerLimit?: HTTPTier): ProviderRateLimit => {
  let quota = DEFAULT_MINUTE_RATE_LIMIT
  if (providerLimit?.rateLimit1h) {
    quota = providerLimit?.rateLimit1h / 60
  } else if (providerLimit?.rateLimit1m) {
    quota = providerLimit?.rateLimit1m
  } else if (providerLimit?.rateLimit1s) {
    quota = providerLimit?.rateLimit1s * 60
  }
  return {
    second: providerLimit?.rateLimit1s || (quota / 60) * BURST_UNDEFINED_QUOTA_MULTIPLE,
    minute: quota
  }
}
