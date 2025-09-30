import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider, parseUnits } from 'ethers'
import { getBounds } from './contract'
import { getRawNav } from './ea'

const SECONDS_IN_DAY = 24 * 60 * 60
const BPS = 10000

// We pull rawNav data from source EA and bounds information from on-chain contract
// We calculate an upper and lower bound
// If rawNav does not fall inside the bounds, we manually clamp it to the bounds
export const getNav = async (
  source: string,
  sourceInput: string,
  sourceScaled: boolean,
  requester: Requester,
  asset: string,
  registry: string,
  provider: JsonRpcProvider,
) => {
  const [rawNav, bounds] = await Promise.all([
    getRawNav(source, sourceInput, requester),
    getBounds({ asset, registry }, provider),
  ])

  const rawNavScaled = sourceScaled
    ? BigInt(rawNav)
    : parseUnits(trimDecimals(rawNav, bounds.decimals), bounds.decimals)

  const now = Date.now() / 1000

  // Generate common response object
  const results = {
    rawNav: rawNavScaled.toString(),
    bases: {
      lookback: { nav: bounds.upper.lookbackNav.toString(), ts: bounds.upper.lookbackTime },
      previous: { nav: bounds.lower.latestNav.toString(), ts: bounds.lower.latestTime },
    },
    decimals: bounds.decimals,
  }

  // Check if we breach lower bound
  let lowerBound = -1n
  if (bounds.lower.isLowerBoundEnabled && bounds.lower.latestNav > 0) {
    const days = (now - bounds.lower.latestTime) / SECONDS_IN_DAY
    const cappedDays = Math.min(1.0, days)
    const scaledMaxDiscount = (1 - bounds.lower.maxDiscount / BPS) ** cappedDays
    const finalDiscount = scaledMaxDiscount * (1 - bounds.lower.lowerBoundTolerance / BPS)
    lowerBound = mulBigInt(bounds.lower.latestNav, finalDiscount, bounds.decimals)
    if (rawNavScaled < lowerBound) {
      return {
        adjustedNav: lowerBound.toString(),
        riskFlag: true,
        breachDirection: 'lower',
        isBounded: false,
        lowerBound: lowerBound.toString(),
        ...results,
      }
    }
  }

  // Check if we breach upper bound
  let upperBound = -1n
  if (bounds.upper.isUpperBoundEnabled && bounds.upper.lookbackNav > 0) {
    const days = (now - bounds.upper.lookbackTime) / SECONDS_IN_DAY
    const bufferFromApy = (1 + bounds.upper.maxExpectedApy / BPS) ** (days / 365)
    const finalBuffer = bufferFromApy * (1 + bounds.upper.upperBoundTolerance / BPS)
    upperBound = mulBigInt(bounds.upper.lookbackNav, finalBuffer, bounds.decimals)
    if (rawNavScaled > upperBound) {
      return {
        adjustedNav: upperBound.toString(),
        riskFlag: false,
        breachDirection: 'upper',
        isBounded: false,
        lowerBound: lowerBound > 0 ? lowerBound.toString() : '',
        upperBound: upperBound.toString(),
        ...results,
      }
    }
  }

  // We are with-in bounds
  return {
    adjustedNav: rawNavScaled.toString(),
    riskFlag: false,
    breachDirection: '',
    isBounded: true,
    lowerBound: lowerBound > 0 ? lowerBound.toString() : '',
    upperBound: upperBound > 0 ? upperBound.toString() : '',
    ...results,
  }
}

const mulBigInt = (value: bigint, multiplier: number, decimals: number) => {
  const scale = 10n ** BigInt(decimals)
  const scaledMultiplier = parseUnits(trimDecimals(multiplier.toString(), decimals), decimals)

  return (value * scaledMultiplier) / scale
}

export const trimDecimals = (number: string, decimals: number) => {
  if (number.indexOf('.') === -1) {
    return number
  }
  const arr = number.split('.')
  const fraction = arr[1].substring(0, decimals)
  return arr[0] + '.' + fraction
}
