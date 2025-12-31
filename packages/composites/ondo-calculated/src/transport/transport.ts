import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { JsonRpcProvider } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../endpoint/price'
import { calculatePrice } from './price'

const logger = makeLogger('PriceTransport')

type RequestParams = typeof inputParameters.validated

export class PriceTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester
  provider!: JsonRpcProvider
  dataEngineUrl!: string

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.provider = new JsonRpcProvider(
      adapterSettings.ETHEREUM_RPC_URL,
      adapterSettings.ETHEREUM_RPC_CHAIN_ID,
    )

    this.dataEngineUrl =
      adapterSettings.DATA_ENGINE_ADAPTER_URL || adapterSettings.DATA_ENGINE_EA_URL || ''
    if (!this.dataEngineUrl) {
      throw new AdapterError({
        statusCode: 500,
        message: 'Missing DATA_ENGINE_ADAPTER_URL',
      })
    }
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

    const result = await calculatePrice({
      ...param,
      provider: this.provider,
      url: this.dataEngineUrl,
      requester: this.requester,
    })

    return {
      data: result,
      statusCode: 200,
      result: result.result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const priceTransport = new PriceTransport()
