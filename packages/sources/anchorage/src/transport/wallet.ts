import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/wallet'

const logger = makeLogger('AnchorageTransport')

type RequestParams = typeof inputParameters.validated

export type CustomTransportTypes = BaseEndpointTypes

interface SubAccountResponse {
  data: {
    accruedFees: []
    balances: {
      assetType: string
      availableForTrading: string
      availableForWithdrawal: string
      totalBalance: string
    }[]
    createdAt: string
    customerId: string
    externalSubaccountId: string
    fees: []
    name: string
    subaccountId: string
  }[]
  page: { next: string | null }
}

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

export class AnchorageTransport extends SubscriptionTransport<CustomTransportTypes> {
  name!: string
  responseCache!: ResponseCache<CustomTransportTypes>
  requester!: Requester
  settings!: CustomTransportTypes['Settings']

  async initialize(
    dependencies: TransportDependencies<CustomTransportTypes>,
    adapterSettings: CustomTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
  }

  async backgroundHandler(
    context: EndpointContext<CustomTransportTypes>,
    entries: RequestParams[],
  ) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<CustomTransportTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(errorMessage, e)
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
    params: RequestParams,
  ): Promise<AdapterResponse<CustomTransportTypes['Response']>> {
    const { customerId, chainId, network } = params

    const providerDataRequestedUnixMs = Date.now()

    // get subaccount IDs of a customer
    const subAccountIDs = await this.fetchAccountData(customerId)

    // get wallets for each subAccount
    const wallets = await this.fetchWallets()

    // filter wallets with subAccountIDs and map to addresses only
    const addresses = wallets
      .filter((w) => subAccountIDs.includes(w.subaccountId))
      .map((w) => {
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

  async fetchAccountData(customerId: string) {
    const data = []
    let hasNext = true
    const requestConfig = {
      baseURL: this.settings.API_ENDPOINT,
      url: `/subaccounts/customers/${customerId}/accounts`,
      headers: {
        'Api-Access-Key': this.settings.API_KEY,
      },
    }
    while (hasNext) {
      const reqKey = requestConfig.baseURL + requestConfig.url
      const response = await this.requester.request<SubAccountResponse>(reqKey, requestConfig)
      data.push(...response.response.data.data)
      hasNext = response.response.data.page.next !== null
      requestConfig.url = response.response.data.page.next as string
    }
    return data.map((s) => s.subaccountId)
  }

  async fetchWallets() {
    const data = []
    let hasNext = true
    const requestConfig = {
      baseURL: this.settings.API_ENDPOINT,
      url: `/wallets`,
      headers: {
        'Api-Access-Key': this.settings.API_KEY,
      },
    }

    while (hasNext) {
      const reqKey = requestConfig.baseURL + requestConfig.url
      const response = await this.requester.request<WalletResponse>(reqKey, requestConfig)
      data.push(...response.response.data.data)
      hasNext = response.response.data.page.next !== null
      requestConfig.url = response.response.data.page.next as string
    }
    return data
  }

  getSubscriptionTtlFromConfig(adapterSettings: CustomTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const anchorageTransport = new AnchorageTransport()
