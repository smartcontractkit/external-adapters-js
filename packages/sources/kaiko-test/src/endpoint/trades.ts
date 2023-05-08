import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { config } from '../config'
import { SingleNumberResultResponse, makeLogger } from '@chainlink/external-adapter-framework/util'
import overrides from '../config/overrides.json'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

const logger = makeLogger('KaikoTrades')

const inputParameters = new InputParameters({
  base: {
    aliases: ['from', 'coin'],
    required: true,
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to convert to',
  },
  interval: {
    required: false,
    type: 'string',
    description:
      'The time interval to use in the query. NOTE: Changing this will likely require changing `millisecondsAgo` accordingly',
    default: '2m',
  },
  millisecondsAgo: {
    required: false,
    type: 'string',
    description:
      'Number of milliseconds from the current time that will determine start_time to use in the query',
    default: '86400000', // 24 hours
  },
  sort: {
    required: false,
    type: 'string',
    description: 'Which way to sort the data returned in the query',
    default: 'desc',
  },
})

export interface RequestParams {
  base: string
  quote: string
  interval: string
  millisecondsAgo: number
  sort: string
}

export interface ResponseSchema {
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

type EndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
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

const httpTransport = new HttpTransport<EndpointTypes>({
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
        const errorMessage = `Kaiko is not returning any price data for ${param.base}/${param.quote}, likely due to too low trading volume for the requested interval. This is not an issue with the external adapter.`
        logger.info(errorMessage)
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage,
          },
        }
      }
      const price = Number(res.data.data[0].price)

      if (price === 0) {
        const errorMessage = `Kaiko returned price of 0 for ${param.base}/${param.quote}`
        logger.info(errorMessage)
        return {
          params: param,
          response: {
            statusCode: 502,
            errorMessage,
          },
        }
      }

      return {
        params: param,
        response: {
          data: {
            result: price,
          },
          result: price,
        },
      }
    })
  },
})

export const endpoint = new CryptoPriceEndpoint<EndpointTypes>({
  name: 'trades',
  aliases: ['price', 'crypto'],
  transport: httpTransport,
  inputParameters,
  overrides: overrides.kaiko,
})
