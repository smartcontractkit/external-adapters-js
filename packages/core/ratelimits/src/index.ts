import { Logger } from '@chainlink/ea-bootstrap'
import limits from './limits.json'
const Limits: Record<string, any> = limits // ugly solution to dynamically reference JSON properties
import * as config from './config'

export interface ProviderRateLimit {
  burst: number
  quota: number
  second: number
  minute: number
}

export type DeclaredTier = {
  rateLimit1s?: number
  rateLimit1m?: number
  rateLimit1h?: number
  tierName: string
}

const calculateLimits = (declaredTier: DeclaredTier) => {
  let quota: number
  if (declaredTier.rateLimit1h) {
    quota = declaredTier.rateLimit1h / 60 // quota is based on per-minute
  } else if (declaredTier.rateLimit1m) {
    quota = declaredTier.rateLimit1m
  } else if (declaredTier.rateLimit1s) {
    quota = declaredTier.rateLimit1s * 60
  } else {
    throw Error('at least one of the rateLimits must be defined')
  }

  let burst: number
  if (declaredTier.rateLimit1s) {
    burst = declaredTier.rateLimit1s
  } else {
    burst = (quota / 60) * config.BURST_UNDEFINED_QUOTA_MULTIPLE
  }

  if (burst < 0) burst = 1000000 // currently using -1 to define unlimited
  if (quota < 0) quota = 1000000 // currently using -1 to define unlimited

  return { burst, quota }
}

const findTier = (providerName: string, tier: number | string): DeclaredTier | undefined => {
  const tierIndex = Number(tier)
  const provider: DeclaredTier[] = Limits[providerName.toLowerCase()]
  if (!provider) {
    Logger.warn(`Rate Limit: Provider with name ${providerName} not found`)
    return
  }
  const plan = Number.isInteger(tierIndex)
    ? provider[tierIndex]
    : provider.find((e) => e.tierName === tier)
  return plan
}

export const getRateLimit = (
  provider: string,
  tier: number | string,
): ProviderRateLimit | undefined => {
  const declaredTier = findTier(provider, tier)
  if (!declaredTier) {
    Logger.warn(
      `Rate Limit: Provider: "${provider}" and Tier: "${tier}" doesn't match any provider spec in limits.json`,
    )
    return
  }
  try {
    const { burst, quota } = calculateLimits(declaredTier)
    return {
      burst: burst,
      quota: quota,
      second: burst,
      minute: quota,
    }
  } catch (e) {
    Logger.warn(`Rate Limit: ${e.message}`)
    return
  }
}
