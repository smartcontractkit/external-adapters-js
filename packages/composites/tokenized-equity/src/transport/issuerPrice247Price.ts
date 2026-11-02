import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider } from 'ethers'
import { assertNotPaused, getIssuer, IssuerRequest } from '../issuers'
import { getDataEngineResult, TargetEndpoint } from '../lib/dataEngine'
import { scaleDecimals } from '../lib/decimals'

// The endpoint's multiplier param: an issuer request plus the issuer name
export type MultiplierParams = IssuerRequest & { issuer: string }

type PriceParams = {
  url: string
  requester: Requester
  targetEndpoint: TargetEndpoint
  feedId: string
  resultPath: string
  decimals: number
}

type MultipliedPriceParams = PriceParams & {
  provider: JsonRpcProvider
  multiplier: MultiplierParams
}

/**
 * Raw stream price without a multiplier: the data-engine EA scales the price
 * to the output decimals directly, so it is truncated once.
 */
export const calculateRawPrice = async (param: PriceParams) => {
  const price = await getDataEngineResult(param)

  return {
    result: price.result,
    decimals: param.decimals,
    rawPrice: price.result,
    rawPriceDecimals: param.decimals,
    dataEngine: price.data,
  }
}

export const calculatePrice = async (param: MultipliedPriceParams) => {
  const issuer = getIssuer(param.multiplier.issuer)
  const multiplierDecimals = issuer.multiplierDecimals

  // Request the price in the same units as the multiplier so both operands
  // share a scale, then apply the requested output decimals once at the end.
  const [price, { multiplier, paused }] = await Promise.all([
    getDataEngineResult({ ...param, decimals: multiplierDecimals }),
    issuer.read(param.multiplier, param.provider),
  ])

  assertNotPaused(issuer, param.multiplier.asset, paused)

  // Full precision product, before the output decimals are applied
  const rawMultipliedPrice = BigInt(price.result) * multiplier
  const rawMultipliedPriceDecimals = multiplierDecimals * 2

  const result = scaleDecimals(
    rawMultipliedPrice,
    rawMultipliedPriceDecimals,
    param.decimals,
  ).toString()

  return {
    result,
    decimals: param.decimals,
    rawPrice: price.result,
    rawPriceDecimals: multiplierDecimals,
    rawMultipliedPrice: rawMultipliedPrice.toString(),
    rawMultipliedPriceDecimals,
    dataEngine: price.data,
    multiplier: {
      issuer: param.multiplier.issuer,
      network: param.multiplier.network,
      value: multiplier.toString(),
      decimals: multiplierDecimals,
      paused,
    },
  }
}
