import { AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, inputParameters } from '../endpoint/price'
import { smoothedStreamPrice } from '../price/smoothedPrice'
import { SmoothedPriceTransport } from './common'

type RequestParams = typeof inputParameters.validated

export class PriceTransport extends SmoothedPriceTransport<BaseEndpointTypes> {
  async _handleRequest(
    param: RequestParams,
  ): Promise<Record<string, AdapterResponse<BaseEndpointTypes['Response']>>> {
    const providerDataRequestedUnixMs = Date.now()

    const results = await smoothedStreamPrice({
      ...param,
      url: this.getDataEngineUrl(),
      tradingHoursUrl: this.getTradingHoursUrl(),
      requester: this.requester,
      streamMaxAgeSeconds: this.streamMaxAgeSeconds,
      sessionStartGatingEnabled: this.sessionStartGatingEnabled,
    })

    return Object.fromEntries(
      results
        .map((r) => ({
          ...r,
          result: r.result.toString(),
        }))
        .map((r) => [
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

export const transport = new PriceTransport()
