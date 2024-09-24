import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/wallet'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getApiInfo } from './utils'

const logger = makeLogger('WalletTransport')

type RequestParams = typeof inputParameters.validated

export type WalletTransportTypes = BaseEndpointTypes

interface WalletResponse {
  data: {
    assets: {
      assetType: string
      availableBalance: {
        assetType: string
        currentPrice: string
        currentUSDValue: string
        quantity: string
      }
      totalBalance: {
        assetType: string
        currentPrice: string
        currentUSDValue: string
        quantity: string
      }
    }[]
    depositAddress: {
      address: string
      addressId: string
      addressSignaturePayload: string
      addressID: string
      signature: string
    }
    isDefault: boolean
    networkId: string
    subaccountId: string
    type: string
    vaultId: string
    vaultName: string
    walletId: string
    walletName: string
  }[]
  page: {
    next: string | null
  }
}

export class WalletTransport extends SubscriptionTransport<WalletTransportTypes> {
  name!: string
  responseCache!: ResponseCache<WalletTransportTypes>
  requester!: Requester
  settings!: WalletTransportTypes['Settings']

  async initialize(
    dependencies: TransportDependencies<WalletTransportTypes>,
    adapterSettings: WalletTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
  }

  async backgroundHandler(
    context: EndpointContext<WalletTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<WalletTransportTypes['Response']>
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
    params: RequestParams,
  ): Promise<AdapterResponse<WalletTransportTypes['Response']>> {
    const { vaultId, chainId, network, coin } = params

    const providerDataRequestedUnixMs = Date.now()

    const apiKey = getApiInfo(coin)

    const wallets = await this.fetchWallets(vaultId, coin, apiKey)

    const addresses = wallets.map((w) => {
      return {
        address: w.depositAddress.address,
        chainId,
        network,
      }
    })

    return {
      data: {
        result: addresses,
      },
      statusCode: 200,
      result: null,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  async fetchWallets(vaultId: string, coin: string, apiKey: string) {
    const wallets = []
    let hasNext = true
    const requestConfig = {
      baseURL: this.settings.API_ENDPOINT,
      url: `/v2/vaults/${vaultId}/wallets?limit=${this.settings.API_LIMIT}`,
      headers: {
        'Api-Access-Key': apiKey,
      },
    }

    while (hasNext) {
      const reqKey = `${requestConfig.baseURL}${requestConfig.url}`
      const response = await this.requester.request<WalletResponse>(reqKey, requestConfig)
      wallets.push(
        ...response.response.data.data.filter(
          (w) => w.networkId.toUpperCase() === coin.toUpperCase(),
        ),
      )
      hasNext = response.response.data.page.next !== null
      if (response.response.data.page.next) {
        requestConfig.url = response.response.data.page.next
      }
    }
    return wallets
  }

  getSubscriptionTtlFromConfig(adapterSettings: WalletTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const walletTransport = new WalletTransport()
