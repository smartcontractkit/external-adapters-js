import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { DEFAULT_INTERVAL, DEFAULT_LIMIT } from '../config'

export const supportedEndpoints = ['stock', 'eod']

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  interval: false,
  limit: false,
}

export interface ResponseSchema {
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
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

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
