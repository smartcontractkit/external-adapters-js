import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { RestTransport } from '@chainlink/external-adapter-framework/transports'
import { DEFAULT_INTERVAL, DEFAULT_MILLISECONDS, DEFAULT_SORT } from '../config'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { customSettings } from '../config'

const inputParameters = {
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
    description:
      'The time interval to use in the query. NOTE: Changing this will likely require changing `millisecondsAgo` accordingly',
    default: '2m',
  },
  millisecondsAgo: {
    required: false,
    description:
      'Number of milliseconds from the current time that will determine start_time to use in the query',
    default: 86_400_000, // 24 hours
  },
  sort: {
    required: false,
    description: 'Which way to sort the data returned in the query',
    default: 'desc',
  },
} as const

export interface RequestParams {
  base: string
  quote: string
  interval?: string
  millisecondsAgo?: number
  sort?: string
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
  Request: {
    Params: RequestParams
  }
  Response: {
    Data: {
      result: number
    }
    Result: number
  }
  CustomSettings: typeof customSettings
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

const restEndpointTransport = new RestTransport<EndpointTypes>({
  prepareRequest: (req, config) => {
    const data = req.requestContext.data
    const base = data.base.toLowerCase()
    const quote = data.quote.toLowerCase()
    const url = `/spot_exchange_rate/${base}/${quote}`

    const interval = data.interval || DEFAULT_INTERVAL
    const start_time = calculateStartTime(data.millisecondsAgo || DEFAULT_MILLISECONDS)
    const sort = data.sort || DEFAULT_SORT

    const params = { interval, sort, start_time }
    return {
      baseURL: config.API_ENDPOINT,
      url,
      params,
      headers: { 'X-Api-Key': config.API_KEY },
    }
  },
  parseResponse: (req, res) => {
    const inverse = (
      req.requestContext as unknown as { data: RequestParams; priceMeta: { inverse: boolean } }
    ).priceMeta.inverse
    const data = res.data.data.filter((x) => x.price !== null)
    if (data.length == 0) {
      throw new AdapterError({
        message:
          'Kaiko is not returning any price data for this price pair, likely due to too low trading volume for the requested interval. This is not an issue with the external adapter.',
      })
    }
    let price = Number(res.data.data[0].price)
    if (inverse && price != 0) {
      price = 1 / price
    }
    return {
      data: {
        result: price,
      },
      statusCode: 200,
      result: price,
    }
  },
  options: {
    requestCoalescing: {
      enabled: true,
    },
  },
})

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'trades',
  transport: restEndpointTransport,
  inputParameters,
})
