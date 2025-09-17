import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider, parseUnits } from 'ethers'
import { getBounds } from './contract'
import { getRawNav } from './ea'

const SECONDS_IN_DAY = 24 * 60 * 60
const BPS = 10000

export const getNav = async (
  ea: string,
  eaInput: string,
  requester: Requester,
  asset: string,
  registry: string,
  provider: JsonRpcProvider,
) => {
  const [rawNav, bounds] = await Promise.all([
    getRawNav(ea, eaInput, requester),
    getBounds(asset, registry, provider),
  ])

  const rawNavScaled = parseUnits(rawNav.toString(), bounds.decimals)

  const now = Date.now() / 1000

  let lowerBound = -1n
  if (bounds.lower.isLowerBoundEnabled && bounds.lower.latestNav > 0) {
    const days = (now - bounds.lower.latestTime) / SECONDS_IN_DAY
    const cappedDays = Math.min(1.0, days)
    const scaledMaxDiscount = (1 - bounds.lower.maxDiscount / BPS) ** cappedDays
    const finalDiscount = scaledMaxDiscount * (1 - bounds.lower.lowerBoundTolerance / BPS)
    lowerBound = mulBigInt(bounds.lower.latestNav, finalDiscount, bounds.decimals)
  }
  let upperBound = -1n
  if (bounds.upper.isUpperBoundEnabled && bounds.upper.lookbackNav > 0) {
    const days = (now - bounds.upper.lookbackTime) / SECONDS_IN_DAY
    const bufferFromApy = (1 + bounds.upper.maxExpectedApy / BPS) ** (days / 365)
    const finalBuffer = bufferFromApy * (1 + bounds.upper.upperBoundTolerance / BPS)
    upperBound = mulBigInt(bounds.upper.lookbackNav, finalBuffer, bounds.decimals)
  }

  const results = {
    rawNav: rawNavScaled.toString(),
    bounds: {
      lowerBound: lowerBound > 0 ? lowerBound.toString() : '',
      upperBound: upperBound > 0 ? upperBound.toString() : '',
    },
    bases: {
      lookback: { nav: bounds.upper.lookbackNav.toString(), ts: bounds.upper.lookbackTime },
      previous: { nav: bounds.lower.latestNav.toString(), ts: bounds.lower.latestTime },
    },
    decimals: bounds.decimals,
  }

  if (lowerBound > 0 && rawNavScaled < lowerBound) {
    return {
      adjustedNav: lowerBound.toString(),
      riskFlag: true,
      breachDirection: 'lower',
      isBounded: false,
      ...results,
    }
  } else if (upperBound > 0 && rawNavScaled > upperBound) {
    return {
      adjustedNav: upperBound.toString(),
      riskFlag: false,
      breachDirection: 'upper',
      isBounded: false,
      ...results,
    }
  } else {
    return {
      adjustedNav: rawNavScaled.toString(),
      riskFlag: false,
      breachDirection: '',
      isBounded: true,
      ...results,
    }
  }
}

const mulBigInt = (value: bigint, multiplier: number, decimals: number) => {
  const scale = 10n ** BigInt(decimals)
  const scaledMultiplier = BigInt(Math.floor(multiplier * Number(scale)))
  return (value * scaledMultiplier) / scale
}
