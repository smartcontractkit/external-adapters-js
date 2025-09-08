import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { ethers } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../../endpoint/wallet'
import { scale, toUsd } from '../rate'
import { getApiKeys } from './utils'
import { getAssets, getWallets } from './wallet'

const logger = makeLogger('Wallet')

type RequestParams = typeof inputParameters.validated

export class WalletTransport extends SubscriptionTransport<BaseEndpointTypes> {
  url!: string
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

    const { proxy, apiKey, privateKey } = getApiKeys(param.client)

    const wallets = await getWallets(this.url, apiKey, privateKey, this.requester, proxy)

    const tokens = await Promise.all(
      wallets.map((w) => getAssets(w, this.url, apiKey, privateKey, this.requester, proxy)),
    )

    const results = await toUsd(
      tokens.flatMap((t) => t),
      Object.fromEntries(param.contracts.map(({ token, address }) => [token, address])),
      this.provider,
    )

    const hex = results
      .map((r) => scale(r.value, { from: r.decimal, to: param.decimals }))
      .reduce((acc, v) => acc + v, 0n)
      .toString(16)

    const result = '0x' + (hex.length % 2 == 1 ? '0' : '') + hex

    return {
      data: {
        result,
        decimals: param.decimals,
        results: results.map((r) => ({
          coin: r.coin,
          amount: r.amount,
          rate: String(r.rate),
          decimal: r.decimal,
          value: String(r.value),
        })),
      },
      statusCode: 200,
      result,
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

export const walletTransport = new WalletTransport()
