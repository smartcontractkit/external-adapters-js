import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/issuerPrice247'
import { AssetRequest, IssuerName, issuers, MULTIPLIER_DECIMALS } from '../issuers'
import { ChainProviders } from '../lib/chains'
import { getDataEngineResult, PriceField, TargetEndpoint } from '../lib/dataEngine'
import { scaleDecimals } from '../lib/decimals'

const logger = makeLogger('IssuerPrice247Transport')

type RequestParams = typeof inputParameters.validated

type PriceParams = {
  settings: BaseEndpointTypes['Settings']
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
  const stream = { ...param, url: settings.DATA_ENGINE_ADAPTER_URL }

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

export class IssuerPrice247Transport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester
  settings!: BaseEndpointTypes['Settings']
  providers = new ChainProviders()

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map((param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    const providerDataRequestedUnixMs = Date.now()
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      const data = await calculatePrice({
        ...param,
        settings: this.settings,
        requester: this.requester,
        providers: this.providers,
      })
      response = {
        data,
        result: data.result,
        statusCode: 200,
        timestamps: {
          providerDataRequestedUnixMs,
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterError)?.statusCode || 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const issuerPrice247Transport = new IssuerPrice247Transport()
