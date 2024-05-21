import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { PoRAddress } from '@chainlink/external-adapter-framework/adapter/por'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, inputParameters } from '../endpoint/wallet'
import { sign } from './utils'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'

const logger = makeLogger('WalletTransport')

type Wallet = {
  id: string
  name: string
  symbol: string
  type: string
  created_at: string
  address: string
}

export interface ResponseSchema {
  wallets: Wallet[]
  pagination: {
    next_cursor: string
    sort_direction: string
    has_next: boolean
  }
}

export type WalletTransportTypes = BaseEndpointTypes
type RequestParams = typeof inputParameters.validated

export class WalletTransport extends SubscriptionTransport<WalletTransportTypes> {
  settings!: WalletTransportTypes['Settings']
  requester!: Requester
  endpointName!: string

  async initialize(
    dependencies: TransportDependencies<WalletTransportTypes>,
    adapterSettings: WalletTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.requester = dependencies.requester
    this.endpointName = endpointName
  }

  async backgroundHandler(
    context: EndpointContext<WalletTransportTypes>,
    entries: RequestParams[],
  ) {
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
        statusCode: 502,
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
  ): Promise<AdapterResponse<WalletTransportTypes['Response']>> {
    const { portfolio, symbols, type, chainId, network, batchSize } = param
    const providerDataRequestedUnixMs = Date.now()

    const walletList = await this.requestWallets(portfolio, symbols, type, batchSize)
    const addresses: PoRAddress[] = walletList.map((wallet) => ({
      address: wallet.address,
      network,
      chainId,
    }))

    return {
      result: null,
      data: {
        result: addresses,
      },
      statusCode: 200,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  async requestWallets(
    portfolio: string,
    symbols: string[],
    type: string,
    batchSize: number,
  ): Promise<Wallet[]> {
    const timestamp = Math.floor(Date.now() / 1000)
    const method = 'GET'
    const path = `/v1/portfolios/${portfolio}/wallets`
    const message = `${timestamp}${method}${path}`
    const signature = sign(message, this.settings.SIGNING_KEY)

    const requestConfig = {
      baseURL: this.settings.API_ENDPOINT,
      url: path,
      headers: {
        'X-CB-ACCESS-KEY': this.settings.ACCESS_KEY,
        'X-CB-ACCESS-PASSPHRASE': this.settings.PASSPHRASE,
        'X-CB-ACCESS-SIGNATURE': signature,
        'X-CB-ACCESS-TIMESTAMP': timestamp,
        'Content-Type': 'application/json',
      },
      params: {
        symbols: symbols.map((symbol) => symbol.toUpperCase()),
        sort_direction: 'ASC',
        cursor: '',
        limit: batchSize,
        type: type.toUpperCase(),
      },
    }

    const walletAccumulator = []
    let continuePolling = true
    while (continuePolling) {
      const res = await this.requester.request<ResponseSchema>(
        calculateHttpRequestKey<WalletTransportTypes>({
          context: {
            adapterSettings: this.settings,
            inputParameters,
            endpointName: this.endpointName,
          },
          data: requestConfig.params,
          transportName: this.name,
        }),
        requestConfig,
      )
      continuePolling = res.response.data.pagination.has_next
      requestConfig.params.cursor = res.response.data.pagination.next_cursor
      walletAccumulator.push(...res.response.data.wallets)
    }

    logger.trace(`walletAccumulator.length = ${walletAccumulator.length}`)
    return walletAccumulator
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const walletTransport = new WalletTransport()
