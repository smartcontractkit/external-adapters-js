import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const RESULT_DECIMALS = 18
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/

export const validateRateBound = (value: string, name: string) => {
  if (!POSITIVE_INTEGER_PATTERN.test(value)) {
    throw new AdapterInputError({
      message: `${name} must be a positive base-10 integer string`,
      statusCode: 400,
    })
  }
}

export const toRateBounds = (minRateValue?: string, maxRateValue?: string) => ({
  minRate: minRateValue === undefined ? undefined : BigInt(minRateValue),
  maxRate: maxRateValue === undefined ? undefined : BigInt(maxRateValue),
})

export const validateRateBounds = (minRateValue?: string, maxRateValue?: string) => {
  if (minRateValue !== undefined) {
    validateRateBound(minRateValue, 'minRate')
  }
  if (maxRateValue !== undefined) {
    validateRateBound(maxRateValue, 'maxRate')
  }

  const { minRate, maxRate } = toRateBounds(minRateValue, maxRateValue)
  if (minRate !== undefined && maxRate !== undefined && minRate > maxRate) {
    throw new AdapterInputError({
      message: 'minRate must be less than or equal to maxRate',
      statusCode: 400,
    })
  }
}

export const applyRateBounds = (computedRate: bigint, minRate?: bigint, maxRate?: bigint) => {
  let rate = computedRate
  if (minRate !== undefined && rate < minRate) {
    rate = minRate
  }
  if (maxRate !== undefined && rate > maxRate) {
    rate = maxRate
  }

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
