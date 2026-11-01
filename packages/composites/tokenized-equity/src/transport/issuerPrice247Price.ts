import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { JsonRpcProvider } from 'ethers'
import { getDataEngineResult, TargetEndpoint } from '../lib/dataEngine'
import { scaleDecimals } from '../lib/decimals'
import { getIssuer, getMultiplierMetadata, MultiplierParams } from '../lib/multiplier'

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
  networkKey: string
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
  const metadata = await getMultiplierMetadata(param.multiplier, param.provider, param.networkKey)
  const multiplierDecimals = metadata.multiplierDecimals

  // Request the price in the same units as the multiplier so both operands
  // share a scale, then apply the requested output decimals once at the end.
  const [price, { multiplier, paused }] = await Promise.all([
    getDataEngineResult({ ...param, decimals: multiplierDecimals }),
    issuer.read(param.multiplier, param.provider, metadata),
  ])

  if (paused) {
    throw new AdapterError({
      statusCode: 503,
      message: `asset: '${param.multiplier.asset}' paused for issuer '${param.multiplier.issuer}'`,
    })
  }

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
