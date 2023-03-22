import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { buildBatchedRequestBody, RouterPriceEndpointParams } from '../../crypto-utils'
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
    return res.data.map((entry) => {
      const param = params.find(
        (p) => `${p.base}${p.quote}`.toLowerCase() === entry.ticker,
      ) as RouterPriceEndpointParams
      return {
        params: param,
        response: {
          data: {
            result: entry.midPrice,
          },
          result: entry.midPrice,
        },
      }
    })
  },
})
