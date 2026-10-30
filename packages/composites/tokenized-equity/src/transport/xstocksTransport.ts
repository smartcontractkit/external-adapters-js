import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { JsonRpcProvider } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../endpoint/xstocks'
import { calculatePrice } from '../price/xstocksPrice'
import { SmoothedPriceTransport } from './common'

type RequestParams = typeof inputParameters.validated

export class XstocksTransport extends SmoothedPriceTransport<BaseEndpointTypes> {
  provider!: JsonRpcProvider

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.provider = new JsonRpcProvider(
      this.config.ETHEREUM_RPC_URL,
      this.config.ETHEREUM_RPC_CHAIN_ID,
    )
  }

  async _handleRequest(
    param: RequestParams,
  ): Promise<Record<string, AdapterResponse<BaseEndpointTypes['Response']>>> {
    const providerDataRequestedUnixMs = Date.now()

    const results = await calculatePrice({
      ...param,
      provider: this.provider,
      url: this.getDataEngineUrl(),
      tradingHoursUrl: this.getTradingHoursUrl(),
      requester: this.requester,
      streamMaxAgeSeconds: this.streamMaxAgeSeconds,
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

export const xstocksTransport = new XstocksTransport()
