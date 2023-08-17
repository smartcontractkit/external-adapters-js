import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, inputParameters } from '../endpoint/balance'
import { BigNumber } from 'ethers'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'

export type BalanceTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: {
      method: string
      params: string[]
      id: number
      jsonrpc: string
    }
  }
}

type RequestParams = typeof inputParameters.validated

export class TotalBalanceTransport extends SubscriptionTransport<BalanceTransportTypes> {
  requester!: Requester
  settings!: BalanceTransportTypes['Settings']
  endpointName!: string

  async initialize(
    dependencies: TransportDependencies<BalanceTransportTypes>,
    adapterSettings: BalanceTransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.settings = adapterSettings
    this.endpointName = endpointName
  }

  async backgroundHandler(
    context: EndpointContext<BalanceTransportTypes>,
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
  ): Promise<AdapterResponse<BalanceTransportTypes['Response']>> {
    const addresses = param.addresses

    const providerDataRequestedUnixMs = Date.now()

    const balances = await Promise.all(
      addresses.map((addr, index) => this.getBalance(addr.address, index)),
    )

    const result = balances
      .reduce((sum, balance) => sum.add(BigNumber.from(balance.result)), BigNumber.from(0))
      .toString()

    return {
      data: {
        balances,
        result,
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

  private async getBalance(address: string, requestId: number) {
    const requestConfig = {
      method: 'POST',
      url: this.settings.FILECOIN_RPC_URL,
      headers: {
        Authorization: `Bearer ${this.settings.API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        method: 'Filecoin.WalletBalance',
        params: [address],
        id: requestId + 1,
        jsonrpc: '2.0',
      },
    }

    const result = await this.requester.request<{ result: string }>(
      calculateHttpRequestKey<BalanceTransportTypes>({
        context: {
          adapterSettings: this.settings,
          inputParameters,
          endpointName: this.endpointName,
        },
        data: requestConfig.data,
        transportName: this.name,
      }),
      requestConfig,
    )

    return {
      address,
      result: result.response.data.result,
    }
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const balanceTransport = new TotalBalanceTransport()
