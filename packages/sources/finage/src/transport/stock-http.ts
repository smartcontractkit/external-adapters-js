import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { StockEndpointTypes } from '../endpoint/utils'

export interface ResponseSchema {
  symbol: string
  ask: number
  bid: number
  asize: number
  bsize: number
  timestamp: number
}

type HttpTransportTypes = StockEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema[]
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return {
      params,
      request: {
        baseURL: config.API_ENDPOINT,
        url: '/last/stocks',
        params: {
          symbols: [...new Set(params.map((p) => p.base.toUpperCase()))].join(','),
          apikey: config.API_KEY,
        },
      },
    }
  },
  parseResponse: (_, res) => {
    // Filter null values in response
    const response: ResponseSchema[] = res.data.filter((e) => e)

    return response.map((entry) => {
      const result = (entry.bid + entry.ask) / 2
      return {
        params: { base: entry.symbol },
        response: {
          data: {
            result,
          },
          result,
          timestamps: {
            providerIndicatedTimeUnixMs: entry.timestamp,
          },
        },
      }
    })
  },
})
