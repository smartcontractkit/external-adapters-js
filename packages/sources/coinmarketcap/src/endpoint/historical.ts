import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['historical']

export const description = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical'

export const inputParameters: InputParameters = {
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

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base?.toUpperCase()
  const convert = validator.validated.data.convert?.toUpperCase()
  const time_start = validator.validated.data.start
  const time_end = validator.validated.data.end
  const count = validator.validated.data.count
  const interval = validator.validated.data.interval
  const convert_id = validator.validated.data.cid
  const aux = validator.validated.data.aux
  const skip_invalid = validator.validated.data.skipInvalid
  const url = 'cryptocurrency/quotes/historical'

  const params = {
    symbol,
    time_start,
    time_end,
    count,
    interval,
    convert,
    convert_id,
    aux,
    skip_invalid,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)
  return Requester.success(jobRunID, response, true)
}
