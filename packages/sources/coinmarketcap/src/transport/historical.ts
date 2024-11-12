import { BaseEndpointTypes } from '../endpoint/historical'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'

export interface ResponseSchema {
  status: {
    timestamp: string
    error_code: number
    error_message: string | null
    elapsed: number
    credit_count: number
    notice: unknown | undefined
  }
  data: {
    quotes: {
      timestamp: string
      quote: {
        [quote: string]: {
          price: number
          volume_24h: number
          market_cap: number
          timestamp: string
        }
      }
    }[]
    id: number
    name: string
    symbol: string
    is_active: number
    is_fiat: number
  }
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}
export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: '/cryptocurrency/quotes/historical',
          headers: {
            'X-CMC_PRO_API_KEY': config.API_KEY,
          },
          params: {
            symbol: param.base.toUpperCase(),
            time_start: param.start,
            time_end: param.end,
            count: param.count,
            interval: param.interval,
            convert: param.convert.toUpperCase(),
            convert_id: param.cid,
            aux: param.aux,
            skip_invalid: param.skipInvalid,
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      return {
        params: param,
        response: {
          ...res.data,
          result: null,
        },
      }
    })
  },
})
