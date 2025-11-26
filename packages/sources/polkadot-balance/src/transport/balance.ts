import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { AccountInfo } from '@polkadot/types/interfaces'
import { BaseEndpointTypes, inputParameters, PolkadotBalance } from '../endpoint/balance'

export type BalanceTransportTypes = BaseEndpointTypes

type RequestParams = typeof inputParameters.validated

export class BalanceTransport extends SubscriptionTransport<BalanceTransportTypes> {
  api!: ApiPromise
  config!: BalanceTransportTypes['Settings']
  endpointName!: string

  async initialize(
    dependencies: TransportDependencies<BalanceTransportTypes>,
    adapterSettings: BalanceTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.config = adapterSettings
    this.endpointName = endpointName
    const wsProvider = new WsProvider(adapterSettings.RPC_URL)
    this.api = await ApiPromise.create({ provider: wsProvider })
    await this.api.isReady
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
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const result: PolkadotBalance[] = []

    const addresses = params.addresses.map(({ address }) => address)
    const accounts: AccountInfo[] = await this.api.query.system.account.multi(addresses)
    accounts.forEach((acc, i) => {
      const address = addresses[i]
      // `free` and `reserved` are of type Balance, which renders sometimes as
      // number and sometimes as hex string. Passing to BigInt takes care of
      // both.
      const { free: freeResponse, reserved: reservedResponse } = acc.data

      const free = BigInt(freeResponse.toString())
      const reserved = BigInt(reservedResponse.toString())
      const balance = free + reserved

      result.push({
        address,
        free: free.toString(),
        reserved: reserved.toString(),
        balance: balance.toString(),
      })
    })

    const response = {
      data: {
        result,
      },
      result: null,
      statusCode: 200,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
    return response
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const transport = new BalanceTransport()
