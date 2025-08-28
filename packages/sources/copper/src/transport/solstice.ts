import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/solstice'

// import { getAssetPositions } from './mirrorX'
// import { btcToUSD } from './btcUSD'
// import { ethers } from 'ethers'
// import { Decimal } from 'decimal.js'
import { getWallets } from './utils'

const logger = makeLogger('Solstice')

type RequestParams = typeof inputParameters.validated

export class SolsticeTransport extends SubscriptionTransport<BaseEndpointTypes> {
  baseUrl!: string
  apiKey!: string
  apiSecret!: string
  requester!: Requester
  // provider!: ethers.JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.baseUrl = adapterSettings.API_ENDPOINT
    this.apiKey = adapterSettings.API_KEY
    this.apiSecret = adapterSettings.API_SECRET
    // this.provider = new ethers.JsonRpcProvider(
    //   adapterSettings.ARBITRUM_RPC_URL,
    //   adapterSettings.ARBITRUM_RPC_CHAIN_ID,
    // )
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

    const [wallets /*activeStakes, pendingStakes, outstandingStakes*/] = await Promise.all([
      getWallets(
        param.portfolioId,
        param.currencies,
        this.baseUrl,
        this.apiKey,
        this.apiSecret,
        this.requester,
      ),
      // getActiveStakes(param.portfolioId, param.currencies, this.baseUrl, this.apiKey, this.apiSecret, this.requester),
      // getPendingStakes(param.portfolioId, param.currencies, this.baseUrl, this.apiKey, this.apiSecret, this.requester),
      // getOutstandingStakes(param.portfolioId, param.currencies, this.baseUrl, this.apiKey, this.apiSecret, this.requester),
    ])

    console.log(wallets /*activeStakes, pendingStakes, outstandingStakes*/)

    // const [asset, rate] = await Promise.all([
    //   getAssetPositions(
    //     param.addresses.flatMap((a) => a.address),
    //     this.url,
    //     this.proxy,
    //     this.apiKey,
    //     this.privateKey,
    //     this.requester,
    //   ),
    //   btcToUSD(this.provider, param.btcUsdContract),
    // ])

    const result = 1
    // BigInt(asset.sum.mul(new Decimal(10).pow(rate.decimal * 2)).toFixed(0)) / rate.value

    return {
      data: {
        result: String(result),
        decimals: 0, //rate.decimal,
        exchangeBalances: [], //asset.exchangeBalances,
        rate: {
          value: '', //String(rate.value),
          decimal: 0, //rate.decimal,
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

export const solsticeTransport = new SolsticeTransport()
