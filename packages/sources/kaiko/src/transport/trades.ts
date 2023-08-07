import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/trades'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('KaikoTrades')

interface ResponseSchema {
  query: {
    page_size: number
    start_time: string
    interval: string
    sort: string
    base_asset: string
    sources: boolean
    ch: boolean
    include_exchanges: string[]
    exclude_exchanges: string[]
    quote_asset: string
    data_version: string
    commodity: string
    request_time: string
    instruments: string[]
    start_timestamp: number
  }
  time: string
  timestamp: number
  data: { timestamp: number; price: string }[]
  result: string
  access: {
    access_range: { start_timestamp: number; end_timestamp: number }
    data_range: { start_timestamp: number; end_timestamp: number }
  }
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

const calculateStartTime = (millisecondsAgo: number) => {
  const date = new Date()
  date.setTime(date.getTime() - millisecondsAgo)
  return date
}

export const transport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      const base = param.base.toLowerCase()
      const quote = param.quote.toLowerCase()
      const url = `/spot_exchange_rate/${base}/${quote}`

      const interval = param.interval
      const start_time = calculateStartTime(Number(param.millisecondsAgo))
      const sort = param.sort

      const requestParams = { interval, sort, start_time }
      return {
        params: [{ ...param }],
        request: {
          baseURL: config.API_ENDPOINT,
          url,
          params: requestParams,
          headers: { 'X-Api-Key': config.API_KEY },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      const data = res.data.data.filter((x) => x.price !== null)
      if (data.length === 0) {
        const errorMessage = `Kaiko is not returning any price data for ${param.base}/${param.quote}, likely due to too low trading volume for the requested interval (${param.interval}). This is not an issue with the external adapter.`
        logger.info(errorMessage)
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage,
          },
        }
      }

      const price = Number(data[0].price)

      return {
        params: param,
        response: {
          data: {
            result: price,
          },
          result: price,
          timestamps: {
            providerIndicatedTimeUnixMs: data[0].timestamp,
          },
        },
      }
    })
  },
})
