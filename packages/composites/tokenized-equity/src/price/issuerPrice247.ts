import { Requester } from '@chainlink/external-adapter-framework/util/requester'

import { AssetRequest, IssuerName, issuers, MULTIPLIER_DECIMALS } from '../issuers'
import { Settings } from '../issuers/issuer'
import { ChainProviders } from '../lib/chains'
import { getDataEngineResult, PriceField, TargetEndpoint } from '../lib/dataEngine'
import { scaleDecimals } from '../lib/decimals'

type PriceParams = {
  settings: Settings
  requester: Requester
  providers: ChainProviders
  targetEndpoint: TargetEndpoint
  feedId: string
  resultPath: PriceField
  decimals: number
  multiplier?: AssetRequest & { issuer: IssuerName }
}

/**
 * The 24/7 stream price, times the issuer's on-chain multiplier when one is
 * requested. The multiplied price is truncated to the output decimals only once.
 */
export const calculatePrice = async ({
  settings,
  providers,
  multiplier,
  ...param
}: PriceParams) => {
  // Validated in endpoint's customInputValidation
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const stream = { ...param, url: settings.SOURCE_ADAPTER_URL.get('DATA_ENGINE')! }

  if (!multiplier) {
    const { result, data } = await getDataEngineResult(stream)
    return {
      result,
      decimals: param.decimals,
      rawPrice: result,
      rawPriceDecimals: param.decimals,
      dataEngine: data,
    }
  }

  const issuer = issuers[multiplier.issuer]
  const provider = providers.get(issuer.chain(settings, multiplier))

  // Request the price in the multiplier's decimals so both share a scale
  const [price, value] = await Promise.all([
    getDataEngineResult({ ...stream, decimals: MULTIPLIER_DECIMALS }),
    issuer.getMultiplier(multiplier, provider),
  ])

  const rawMultipliedPrice = BigInt(price.result) * value
  const rawMultipliedPriceDecimals = 2 * MULTIPLIER_DECIMALS

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
      issuer: multiplier.issuer,
      network: multiplier.network,
      value: value.toString(),
      decimals: MULTIPLIER_DECIMALS,
    },
  }
}
