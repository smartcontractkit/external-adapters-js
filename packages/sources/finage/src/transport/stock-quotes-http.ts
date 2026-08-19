import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock-quotes'
import { determineStockQuotesMidPrice, isValidNumber } from './utils'

const logger = makeLogger('StockQuotesHttp')

export interface ResponseSchema {
  symbol: string
  ask: number
  bid: number
  asize: number
  bsize: number
  timestamp: number
}

type HttpTransportTypes = BaseEndpointTypes & {
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
          url: `/last/stock/${param.base.toUpperCase()}`,
          params: {
            apikey: config.API_KEY,
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    const response = res.data
    if (
      !response ||
      !isValidNumber(response.ask) ||
      !isValidNumber(response.bid) ||
      !isValidNumber(response.asize) ||
      !isValidNumber(response.bsize) ||
      !isValidNumber(response.timestamp)
    ) {
      logger.warn(`Received ${JSON.stringify(response)} with invalid or missing fields.`)
      return params.map((param) => {
        return {
          params: { base: param.base },
          response: {
            errorMessage: `Data provider API did not provide valid data for ${JSON.stringify(
              param,
            )}`,
            statusCode: 502,
          },
        }
      })
    }

    return params.map((param) => {
      const mid_price = determineStockQuotesMidPrice(response.bid, response.ask)
      return {
        params: { base: param.base },
        response: {
          result: null,
          data: {
            mid_price,
            bid_price: response.bid,
            bid_volume: response.bsize,
            ask_price: response.ask,
            ask_volume: response.asize,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: response.timestamp,
          },
        },
      }
    })
  },
})
