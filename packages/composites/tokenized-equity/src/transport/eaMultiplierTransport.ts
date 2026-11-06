import { AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, inputParameters } from '../endpoint/eaMultiplier'
import { calculatePrice } from '../price/eaMultiplierPrice'
import { SmoothedPriceTransport } from './common'

type RequestParams = typeof inputParameters.validated

export class EAMultiplierTransport extends SmoothedPriceTransport<BaseEndpointTypes> {
  async _handleRequest(
    param: RequestParams,
  ): Promise<Record<string, AdapterResponse<BaseEndpointTypes['Response']>>> {
    const providerDataRequestedUnixMs = Date.now()

    const results = await calculatePrice({
      ...param,
      url: this.getDataEngineUrl(),
      tradingHoursUrl: this.getTradingHoursUrl(),
      requester: this.requester,
      sourceAdapterUrl: this.config.SOURCE_ADAPTER_URL.get(param.sourceAdapter),
      sourceAdapterParams: param.params,
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

export const eaMultiplierTransport = new EAMultiplierTransport()
