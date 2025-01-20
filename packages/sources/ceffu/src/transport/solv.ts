import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterResponse, sleep, makeLogger } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/solv'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getAssetPositions } from './mirrorX'
import { btcToUSD } from './btcUSD'
import { ethers } from 'ethers'
import { Decimal } from 'decimal.js'

const logger = makeLogger('Solv')

type RequestParams = typeof inputParameters.validated

export class SolvTransport extends SubscriptionTransport<BaseEndpointTypes> {
  url!: string
  proxy!: string
  apiKey!: string
  privateKey!: string
  requester!: Requester
  provider!: ethers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.url = adapterSettings.API_ENDPOINT
    this.proxy = adapterSettings.API_PROXY
    this.apiKey = adapterSettings.API_KEY
    this.privateKey = adapterSettings.PRIVATE_KEY
    this.provider = new ethers.JsonRpcProvider(
      adapterSettings.ARBITRUM_RPC_URL,
      adapterSettings.ARBITRUM_RPC_CHAIN_ID,
    )
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

    const [asset, rate] = await Promise.all([
      getAssetPositions(
        param.addresses.flatMap((a) => a.address),
        this.url,
        this.proxy,
        this.apiKey,
        this.privateKey,
        this.requester,
      ),
      btcToUSD(this.provider, param.btcUsdContract),
    ])

    const result =
      BigInt(asset.sum.mul(new Decimal(10).pow(rate.decimal * 2)).toFixed(0)) / rate.value

    return {
      data: {
        result: String(result),
        decimals: rate.decimal,
        exchangeBalances: asset.exchangeBalances,
        rate: {
          value: String(rate.value),
          decimal: rate.decimal,
        },
      },
      statusCode: 200,
      result: String(result),
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

export const solvTransport = new SolvTransport()
