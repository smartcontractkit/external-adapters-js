import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const RESULT_DECIMALS = 18

export const parseRateBound = (value: string, name: string) => {
  let parsed: bigint
  try {
    parsed = BigInt(value)
  } catch {
    throw new AdapterInputError({
      message: `${name} must be a positive base-10 integer string`,
      statusCode: 400,
    })
  }

  if (parsed <= 0n || parsed.toString() !== value) {
    throw new AdapterInputError({
      message: `${name} must be a positive base-10 integer string`,
      statusCode: 400,
    })
  }

  return parsed
}

export const parseRateBounds = (minRateValue: string, maxRateValue: string) => {
  const minRate = parseRateBound(minRateValue, 'minRate')
  const maxRate = parseRateBound(maxRateValue, 'maxRate')
  if (minRate > maxRate) {
    throw new AdapterInputError({
      message: 'minRate must be less than or equal to maxRate',
      statusCode: 400,
    })
  }

  return { minRate, maxRate }
}

export const applyRateBounds = (computedRate: bigint, minRate: bigint, maxRate: bigint) => {
  const rate = computedRate < minRate ? minRate : computedRate > maxRate ? maxRate : computedRate

  return {
    rate,
    boundsApplied: rate !== computedRate,
  }
}

export const calculateNormalizedRate = (
  assets: bigint,
  shares: bigint,
  assetDecimals: number,
  shareDecimals: number,
) => {
  if (shares === 0n) {
    return null
  }

  return (
    (assets * 10n ** BigInt(RESULT_DECIMALS + shareDecimals)) /
    (shares * 10n ** BigInt(assetDecimals))
  )
}

export const calculateUnvestedAssets = (
  assets: bigint,
  unixTimestamp: bigint,
  vestingStartTime: bigint,
  vestingEndTime: bigint,
) => {
  if (assets === 0n || vestingEndTime <= vestingStartTime || unixTimestamp >= vestingEndTime) {
    return 0n
  }
  if (unixTimestamp <= vestingStartTime) {
    return assets
  }

  return (assets * (vestingEndTime - unixTimestamp)) / (vestingEndTime - vestingStartTime)
}
