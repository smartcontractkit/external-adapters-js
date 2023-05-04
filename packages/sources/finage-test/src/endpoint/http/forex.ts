import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { PriceEndpointTypes } from '../types'

interface ResponseSchema {
  symbol: string
  bid: number
  ask: number
  timestamp: number
}

type HttpTransportTypes = PriceEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const symbol = `${param.base}${param.quote}`.toUpperCase()
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: `/last/forex/${symbol}`,
          params: { apikey: config.API_KEY },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const result = (res.data.ask + res.data.bid) / 2
      return {
        params: param,
        response: {
          data: {
            result,
          },
          result,
          timestamps: {
            providerIndicatedTimeUnixMs: res.data.timestamp,
          },
        },
      }
    })
  },
})
