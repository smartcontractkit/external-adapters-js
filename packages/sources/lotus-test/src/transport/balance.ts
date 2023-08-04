import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterRequest, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, inputParameters } from '../endpoint/balance'
import { BigNumber } from 'ethers'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'

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
export class TotalBalanceTransport implements Transport<BalanceTransportTypes> {
  name!: string
  responseCache!: ResponseCache<BalanceTransportTypes>
  requester!: Requester
  endpointName!: string

  async initialize(
    dependencies: TransportDependencies<BalanceTransportTypes>,
    _adapterSettings: BalanceTransportTypes['Settings'],
    _endpointName: string,
    transportName: string,
  ): Promise<void> {
    this.responseCache = dependencies.responseCache
    this.requester = dependencies.requester
    this.name = transportName
    this.endpointName = _endpointName
  }
  async foregroundExecute(
    req: AdapterRequest<typeof inputParameters.validated>,
    settings: BalanceTransportTypes['Settings'],
  ): Promise<AdapterResponse<BalanceTransportTypes['Response']>> {
    const addresses = req.requestContext.data.addresses
    // Custom transport logic

    const balances = await Promise.all(
      addresses.map((addr, index) => this.getBalance(addr.address, index, settings)),
    )

    const result = balances
      .reduce((sum, balance) => sum.add(balance.result as unknown as BigNumber), BigNumber.from(0))
      .toString()

    const response = {
      data: {
        balances,
        result,
      },
      statusCode: 200,
      result,
      timestamps: {
        providerDataRequestedUnixMs: Date.now(),
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
    await this.responseCache.write(this.name, [
      {
        params: req.requestContext.data,
        response,
      },
    ])

    return response
  }

  private async getBalance(
    address: string,
    requestId: number,
    settings: BalanceTransportTypes['Settings'],
  ) {
    const requestConfig = {
      method: 'POST',
      url: settings.RPC_URL,
      headers: {
        Authorization: `Bearer ${settings.API_KEY}`,
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
          adapterSettings: settings,
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
}

export const customTransport = new TotalBalanceTransport()
