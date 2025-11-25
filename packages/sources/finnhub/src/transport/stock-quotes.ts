import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { config } from '../config'
import { BaseEndpointTypes } from '../endpoint/stock-quotes'

interface ProviderResponseBody {
  a: number // ask price
  av: number // ask volume
  b: number // bid price
  bv: number // bid volume
  t: number // timestamp
  s: string // ticker
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, settings: typeof config.settings) => {
    return [
      {
        params: params,
        request: {
          baseURL: `${settings.API_ENDPOINT}/stock/bidask-snapshot`,
          method: 'GET',
          params: {
            token: settings.API_KEY,
          },
        },
      },
    ]
  },
  parseResponse: (params, res) => {
    if (!res.data || res.data.length == 0) {
      return params.map((param) => {
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage: `No data for ${param.base}`,
          },
        }
      })
    }

    return res.data.map((data) => {
      if (data.t == 0) {
        return {
          params: { base: data.s },
          response: {
            statusCode: 502,
            errorMessage: `Timestamp received for ${data.s} is 0`,
          },
        }
      }

      let midPrice: number
      if (data.b == 0) {
        midPrice = data.a
      } else if (data.a == 0) {
        midPrice = data.b
      } else {
        midPrice = (data.b * data.bv + data.a * data.av) / (data.bv + data.av)
      }

      return {
        params: { base: data.s },
        response: {
          result: null,
          data: {
            mid_price: midPrice,
            bid_price: data.b,
            bid_volume: data.bv,
            ask_price: data.a,
            ask_volume: data.av,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: data.t,
          },
        },
      }
    })
  },
})
