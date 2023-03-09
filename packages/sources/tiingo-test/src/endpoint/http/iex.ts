import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { IEXEndpointTypes } from '../common/iex-router'

interface ProviderResponseBody {
  prevClose: number
  last: number
  lastSaleTimestamp: string
  low: number
  bidSize: number
  askPrice: number
  open: number
  mid: number
  volume: number
  lastSize: number
  tngoLast: number
  ticker: string
  askSize: number
  quoteTimestamp: string
  bidPrice: number
  timestamp: string
  high: number
}

type HttpIEXEndpointTypes = IEXEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}

export const httpTransport = new HttpTransport<HttpIEXEndpointTypes>({
  prepareRequests: (params, config) => {
    return {
      params: params,
      request: {
        baseURL: config.API_ENDPOINT,
        url: 'iex',
        params: {
          token: config.API_KEY,
          tickers: [...new Set(params.map((p) => `${p.ticker.toLowerCase()}`))].join(','),
        },
      },
    }
  },
  parseResponse: (_, res) => {
    return res.data.map((entry) => {
      return {
        params: { ticker: entry.ticker },
        response: {
          data: {
            result: entry.tngoLast,
          },
          result: entry.tngoLast,
        },
      }
    })
  },
})
