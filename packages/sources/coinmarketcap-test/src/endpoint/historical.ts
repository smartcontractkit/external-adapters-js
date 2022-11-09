import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { RestTransport } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SettingsMap } from '@chainlink/external-adapter-framework/config'
import { EmptyObject } from '@chainlink/external-adapter-framework/util'

const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin', 'sym', 'symbol'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
  convert: {
    aliases: ['quote', 'to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
  start: {
    description: 'Timestamp (Unix or ISO 8601) to start returning quotes for',
    required: false,
    type: 'string',
  },
  end: {
    description: 'Timestamp (Unix or ISO 8601) to stop returning quotes for',
    required: false,
    type: 'string',
  },
  count: {
    description: 'The number of interval periods to return results for',
    required: false,
    type: 'number',
    default: 10,
  },
  interval: {
    description: 'Interval of time to return data points for',
    required: false,
    type: 'string',
    default: '5m',
  },
  cid: {
    description: 'The CMC coin ID (optional to use in place of base)',
    required: false,
    type: 'string',
  },
  aux: {
    description: 'Optionally specify a comma-separated list of supplemental data fields to return',
    required: false,
    type: 'string',
  },
  skipInvalid: {
    description: '',
    required: false,
    type: 'string',
  },
} as const

export type RequestParams = {
  base: string
  convert: string
  start: string
  end: string
  count: number
  interval: string
  cid: string
  aux: string
  skipInvalid: string
}

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

export interface RequestBody {
  symbol: string
  time_start: string
  time_end: string
  count: number
  interval: string
  convert: string
  convert_id: string
  aux: string
  skip_invalid: string
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: {
    Data: EmptyObject
    Result: null
  }
  CustomSettings: SettingsMap
  Provider: {
    RequestBody: RequestBody
    ResponseBody: ResponseSchema
  }
}

const restTransport = new RestTransport<EndpointTypes>({
  prepareRequest: (req, config) => {
    const data = req.requestContext.data
    const params = {
      symbol: data.base.toUpperCase(),
      time_start: data.start,
      time_end: data.end,
      count: data.count,
      interval: data.interval,
      convert: data.convert.toUpperCase(),
      convert_id: data.cid,
      aux: data.aux,
      skip_invalid: data.skipInvalid,
    }
    return {
      baseURL: 'https://pro-api.coinmarketcap.com/v1/',
      url: '/cryptocurrency/quotes/historical',
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': config.API_KEY || '',
      },
      params,
    }
  },
  parseResponse: (_, res) => {
    return {
      ...res.data,
      statusCode: 200,
      result: null,
    }
  },
  options: {
    requestCoalescing: {
      enabled: true,
    },
  },
})

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'historical',
  transport: restTransport,
  inputParameters,
})
