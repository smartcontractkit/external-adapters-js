import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'

const inputParameters = new InputParameters({
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
})

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
  Parameters: typeof inputParameters.definition
  Response: {
    Data: unknown
    Result: null
  }
  Settings: typeof config.settings
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

const httpTransport = new HttpTransport<EndpointTypes>({
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

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'historical',
  transport: httpTransport,
  inputParameters,
  overrides: overrides.coinmarketcap,
})
