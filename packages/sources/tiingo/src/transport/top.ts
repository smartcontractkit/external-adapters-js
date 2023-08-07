import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/top'
import { buildBatchedRequestBody } from './utils'
interface ProviderResponseBody {
  ticker: string
  baseCurrency: string
  quoteCurrency: string
  topOfBookData: {
    askSize: number
    bidSize: number
    lastSaleTimestamp: string
    lastPrice: number
    askPrice: number
    quoteTimestamp: string
    bidExchange: string
    lastSizeNotional: number
    lastExchange: string
    askExchange: string
    bidPrice: number
    lastSize: number
  }[]
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}
export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config, 'tiingo/crypto/top')
  },
  parseResponse: (_, res) => {
    return res.data.map((entry) => {
      return {
        params: { base: entry.baseCurrency, quote: entry.quoteCurrency },
        response: {
          data: {
            result: entry.topOfBookData[0].lastPrice,
          },
          result: entry.topOfBookData[0].lastPrice,
        },
      }
    })
  },
})
