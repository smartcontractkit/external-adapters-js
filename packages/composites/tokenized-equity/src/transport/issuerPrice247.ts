import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { JsonRpcProvider } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../endpoint/issuerPrice247'
import { TargetEndpoint } from '../lib/dataEngine'
import { getNetworkRpc } from '../lib/multiplier'
import { calculatePrice, calculateRawPrice } from './issuerPrice247Price'

const logger = makeLogger('IssuerPrice247Transport')

type RequestParams = typeof inputParameters.validated

export class IssuerPrice247Transport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester
  config!: BaseEndpointTypes['Settings']
  dataEngineUrl!: string
  providers: Record<string, JsonRpcProvider> = {}

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.config = adapterSettings
    this.dataEngineUrl = adapterSettings.DATA_ENGINE_ADAPTER_URL
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
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

  async _handleRequest(
    param: RequestParams,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()

    const priceParams = {
      ...param,
      targetEndpoint: param.targetEndpoint as TargetEndpoint,
      url: this.dataEngineUrl,
      requester: this.requester,
    }
    // Without a multiplier the raw stream price is returned
    const data: BaseEndpointTypes['Response']['Data'] = param.multiplier
      ? await calculatePrice({
          ...priceParams,
          ...this.getProvider(param.multiplier),
          multiplier: param.multiplier,
        })
      : await calculateRawPrice(priceParams)

    return {
      data,
      statusCode: 200,
      result: data.result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getProvider(multiplier: NonNullable<RequestParams['multiplier']>) {
    const { url, chainId } = getNetworkRpc(this.config, multiplier.network) ?? {}
    if (!url) {
      // Rejected by input validation, kept for type safety
      throw new AdapterError({
        statusCode: 400,
        message: `No RPC URL for multiplier.network '${multiplier.network}'`,
      })
    }
    const networkKey = `${url}@@${chainId ?? ''}`
    // Without a configured chain ID, ethers detects it from the RPC
    this.providers[networkKey] ??= new JsonRpcProvider(url, chainId)
    return { provider: this.providers[networkKey], networkKey }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const issuerPrice247Transport = new IssuerPrice247Transport()
