import { AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { JsonRpcProvider } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../endpoint/robinhood'
import { calculatePrice } from '../price/robinhoodPrice'
import { SmoothedPriceTransport } from './common'

type RequestParams = typeof inputParameters.validated

export class RobinhoodTransport extends SmoothedPriceTransport<BaseEndpointTypes> {
  providerForNetwork: Record<string, JsonRpcProvider> = {}

  async _handleRequest(
    param: RequestParams,
  ): Promise<Record<string, AdapterResponse<BaseEndpointTypes['Response']>>> {
    const providerDataRequestedUnixMs = Date.now()

    this.providerForNetwork[param.network] ??= new JsonRpcProvider(
      this.config.ROBINHOOD_NETWORK_RPC_URL.get(param.network),
      this.config.ROBINHOOD_NETWORK_CHAIN_ID.get(param.network),
    )

    const results = await calculatePrice({
      ...param,
      provider: this.providerForNetwork[param.network],
      url: this.getDataEngineUrl(),
      tradingHoursUrl: this.getTradingHoursUrl(),
      requester: this.requester,
    })

    return Object.fromEntries(
      results.map((r) => [
        r.smoother.smoother,
        {
          data: r,
          statusCode: 200,
          result: r.result,
          timestamps: {
            providerDataRequestedUnixMs,
            providerDataReceivedUnixMs: Date.now(),
            providerIndicatedTimeUnixMs: undefined,
          },
        },
      ]),
    )
  }
}

export const robinhoodTransport = new RobinhoodTransport()
