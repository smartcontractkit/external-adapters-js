import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'
import { DEFAULT_INTERVAL, DEFAULT_LIMIT } from '../config'

export const supportedEndpoints = ['stock', 'eod']

export const description =
  '**NOTE: the `eod` endpoint is temporarily still supported, however, is being deprecated. Please use the `stock` endpoint instead.**'

export type TInputParameters = { base: string; interval: string; limit: number }
export const inputParameters: InputParameters<TInputParameters> = {
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

  const response = await Requester.request<ResponseSchema>(reqConfig)
  const result = Requester.validateResultNumber(response.data, ['data', 0, 'close'])

  return Requester.success(jobRunID, Requester.withResult(response, result))
}
