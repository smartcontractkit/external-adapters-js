import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/price'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'

const logger = makeLogger('Intrinio Price')

type ProviderResponseBody = {
  last_price: number
  last_time: string
  last_size: number
  bid_price: number
  bid_size: number
  ask_price: number
  ask_size: number
  open_price: number
  close_price: number | null
  high_price: number
  low_price: number
  exchange_volume: number | null
  market_volume: number
  updated_on: string | null
  source: string
  security: {
    id: string
    ticker: string
    exchange_ticker: string
    figi: string
    composite_figi: string
  }
}

type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((symbol) => {
      const requestConfig = {
        baseURL: config.API_ENDPOINT,
        url: `securities/${symbol.base}/prices/realtime`,
        params: {
          api_key: config.API_KEY,
        },
      }
      return {
        params: [symbol],
        request: requestConfig,
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((requestPayload) => {
      const entry = {
        params: requestPayload,
      }
      if (!res.data) {
        const errorMessage = `Intrinio provided no data for token "${requestPayload.base}"`
        logger.warn(errorMessage)
        return {
          ...entry,
          response: {
            statusCode: 502,
            errorMessage,
          },
        }
      }
      const result = res.data.last_price
      return {
        ...entry,
        response: {
          data: {
            result,
          },
          result,
        },
      }
    })
  },
})
