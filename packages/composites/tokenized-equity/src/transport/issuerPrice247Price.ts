import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider } from 'ethers'
import { Issuer, IssuerRequest, MULTIPLIER_DECIMALS } from '../issuers'
import { getDataEngineResult, PriceField, TargetEndpoint } from '../lib/dataEngine'
import { scaleDecimals } from '../lib/decimals'

type PriceParams = {
  url: string
  requester: Requester
  targetEndpoint: TargetEndpoint
  feedId: string
  resultPath: PriceField
  decimals: number
}

type MultipliedPriceParams = PriceParams & {
  issuer: Issuer
  multiplier: IssuerRequest
  provider: JsonRpcProvider
}

/**
 * Raw stream price without a multiplier: the data-engine EA scales the price
 * to the output decimals directly, so it is truncated once.
 */
export const calculateRawPrice = async (param: PriceParams) => {
  const { result, data } = await getDataEngineResult(param)

  return {
    result,
    decimals: param.decimals,
    rawPrice: result,
    rawPriceDecimals: param.decimals,
    dataEngine: data,
  }
}

export const calculatePrice = async ({
  issuer,
  multiplier: request,
  provider,
  ...param
}: MultipliedPriceParams) => {
  // Request the price in the same units as the multiplier so both operands
  // share a scale, then apply the requested output decimals once at the end.
  const [price, { multiplier, paused }] = await Promise.all([
    getDataEngineResult({ ...param, decimals: MULTIPLIER_DECIMALS }),
    issuer.read(request, provider),
  ])

  // Full precision product, before the output decimals are applied
  const rawMultipliedPrice = BigInt(price.result) * multiplier
  const rawMultipliedPriceDecimals = MULTIPLIER_DECIMALS * 2

  return {
    result: scaleDecimals(
      rawMultipliedPrice,
      rawMultipliedPriceDecimals,
      param.decimals,
    ).toString(),
    decimals: param.decimals,
    rawPrice: price.result,
    rawPriceDecimals: MULTIPLIER_DECIMALS,
    rawMultipliedPrice: rawMultipliedPrice.toString(),
    rawMultipliedPriceDecimals,
    dataEngine: price.data,
    multiplier: {
      issuer: issuer.name,
      network: request.network,
      value: multiplier.toString(),
      decimals: MULTIPLIER_DECIMALS,
      paused,
    },
  }
}
