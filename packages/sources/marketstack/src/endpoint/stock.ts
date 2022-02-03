import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { DEFAULT_INTERVAL, DEFAULT_LIMIT } from '../config'

export const supportedEndpoints = ['stock', 'eod']

export const description =
  '**NOTE: the `eod` endpoint is temporarily still supported, however, is being deprecated. Please use the `stock` endpoint instead.**'

export const inputParameters: InputParameters = {
  base: {
    required: true,
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    type: 'string',
  },
  interval: {
    required: false,
    description: 'The symbol of the currency to convert to',
    type: 'string',
    default: '1min',
  },
  limit: {
    required: false,
    description: 'The limit for number of results',
    type: 'number',
    default: 1,
  },
}

export interface ResponseSchema {
  data: {
    open: number
    high: number
    low: number
    close: number
    volume: number
    adj_high: number
    adj_low: number
    adj_close: number
    adj_open: number
    adj_volume: number
    split_factor: number
    dividend: number
    symbol: string
    exchange: string
    date: string
  }[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const symbols = validator.validated.data.base.toUpperCase()
  const interval = validator.validated.data.interval || DEFAULT_INTERVAL
  const limit = validator.validated.data.limit || DEFAULT_LIMIT
  const url = `eod`

  const params = {
    symbols,
    interval,
    limit,
    access_key: config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    params,
    url,
  }

  const response = await HTTP.request<ResponseSchema>(reqConfig)
  const result = HTTP.validateResultNumber(response.data, ['data', 0, 'close'])

  return HTTP.success(jobRunID, HTTP.withResult(response, result))
}
