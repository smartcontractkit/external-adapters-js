import Limits from './limits.json'
type provider = keyof typeof Limits;

const BURST_UNDEFINED_QUOTA_MULTIPLE = 2

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
    burst = (quota / 60) * BURST_UNDEFINED_QUOTA_MULTIPLE
  }

  return [burst, quota]
}

const findTier = (provider: string, tier?: number, tierName?: string): DeclaredTier => {
  const matchedTier =
    tier !== undefined
      ? limits[provider][tier]
      : (Limits[provider] as DeclaredTier[]).find( element => element.tierName === tierName )
  if (matchedTier === undefined) {
    throw Error("tier or tierName doesn't match provider spec in limits.json")
  }
  return matchedTier
}

export const getRateLimit = (
  provider: string,
  tier?: number,
  tierName?: string,
): ProviderRateLimit => {
  if (tier === undefined && tierName === undefined) {
    throw Error('tier or tierName must be provided')
  }
  const declaredTier = findTier(provider, tier, tierName)
  const [burst, quota] = calculateLimits(declaredTier)
  return {
    burst: burst,
    quota: quota,
    second: burst,
    minute: quota,
  }
}
