import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { BaseEndpointTypes, inputParameters } from '../endpoint/wallet'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getApiInfo } from './utils'

const logger = makeLogger('BitgoTransport')

type RequestParams = typeof inputParameters.validated

export type WalletTransportTypes = BaseEndpointTypes

interface WalletResponse {
  wallets: {
    id: string
    users: []
    coin: string
    label: string
    m: number
    n: number
    keys: []
    enterprise: string
    organization: string
    bitgoOrg: string
    tags: []
    disableTransactionNotifications: boolean
    deleted: boolean
    approvalsRequired: number
    isCold: boolean
    clientFlags: []
    walletFlags: []
    allowBackupKeySigning: boolean
    recoverable: boolean
    startDate: string
    type: string
    hasLargeNumberOfAddresses: boolean
    multisigType: string
    hasReceiveTransferPolicy: boolean
    receiveAddress: []
    balance: number
    balanceString: string
    rbfBalance: number
    rbfBalanceString: string
    confirmedBalance: number
    confirmedBalanceString: string
    spendableBalance: number
    spendableBalanceString: string
    unspentCount: number
  }[]
  coin: string
  nextBatchPrevId?: string
}

interface AddressResponse {
  coin: string
  totalAddressCount: number
  addresses: {
    id: string
    address: string
    chain: number
    index: number
    coin: string
    wallet: string
    proof: string
    signature: string
  }[]
  count: number
  nextBatchPrevId?: string
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
    const { chainId, network } = params
    const coin = params.coin.toLowerCase()

    const providerDataRequestedUnixMs = Date.now()

    const { apiKey, apiEndpoint, apiLimit } = getApiInfo(params.reserve, this.settings)

    // get wallet Ids for a coin
    const walletIds = await this.fetchWalletIds(coin, apiKey, apiEndpoint, apiLimit)

    // get addresses for each wallet
    const addresses = await Promise.all(
      walletIds.map(async (walletId) =>
        this.fetchWalletAddresses(coin, walletId, apiKey, apiEndpoint, apiLimit),
      ),
    )

    const result = addresses.flat().map((address) => {
      return {
        address,
        chainId,
        network,
      }
    })

    return {
      data: {
        result,
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

  async fetchWalletAddresses(
    coin: string,
    walletId: string,
    apiKey: string,
    apiEndpoint: string,
    apiLimit: number,
  ) {
    const addresses: string[] = []

    const requestConfig = {
      baseURL: apiEndpoint,
      url: `/${coin}/wallet/${walletId}/addresses`,
      params: {
        limit: apiLimit,
        prevId: '',
      },
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }

    let hasNext = true
    while (hasNext) {
      const reqKey = `${requestConfig.baseURL}${requestConfig.url}${JSON.stringify(
        requestConfig.params,
      )}`
      const response = await this.requester.request<AddressResponse>(reqKey, requestConfig)
      hasNext = response.response.data.nextBatchPrevId !== undefined
      addresses.push(...response.response.data.addresses.map((a) => a.address))
      requestConfig.params.prevId = response.response.data.nextBatchPrevId as string
    }

    return addresses
  }

  async fetchWalletIds(coin: string, apiKey: string, apiEndpoint: string, apiLimit: number) {
    const walletIds: string[] = []
    const requestConfig = {
      baseURL: apiEndpoint,
      url: `/${coin}/wallet`,
      params: {
        limit: apiLimit,
        prevId: '',
      },
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }

    let hasNext = true
    while (hasNext) {
      const reqKey =
        requestConfig.baseURL + requestConfig.url + JSON.stringify(requestConfig.params)
      const response = await this.requester.request<WalletResponse>(reqKey, requestConfig)
      hasNext = response.response.data.nextBatchPrevId !== undefined
      walletIds.push(...response.response.data.wallets.map((w) => w.id))
      requestConfig.params.prevId = response.response.data.nextBatchPrevId as string
    }
    return walletIds
  }

  getSubscriptionTtlFromConfig(adapterSettings: WalletTransportTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const walletTransport = new WalletTransport()
