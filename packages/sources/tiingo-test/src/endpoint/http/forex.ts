import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { buildBatchedRequestBody } from '../../crypto-utils'
import { ForexEndpointTypes } from '../common/forex-router'

interface ProviderResponseBody {
  ticker: string
  quoteTimestamp: string
  bidPrice: number
  bidSize: number
  askPrice: number
  askSize: number
  midPrice: number
}

type HttpForexEndpointTypes = ForexEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}

export const httpTransport = new HttpTransport<HttpForexEndpointTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config, 'tiingo/fx/top')
  },
  parseResponse: (params, res) => {
    return params.map((p) => {
      const entry = res.data.find((entry) => `${p.base}${p.quote}`.toLowerCase() === entry.ticker)

      if (!entry) {
        return {
          params: p,
          response: {
            errorMessage: `Tiingo provided no data for ${p.base}/${p.quote}`,
            statusCode: 502,
          },
        }
      } else {
        return {
          params: p,
          response: {
            data: {
              result: entry.midPrice,
            },
            result: entry.midPrice,
          },
        }
      }
    })
  },
})
