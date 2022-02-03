import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['crypto', 'price']

export const description =
  '**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**'

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
}

export interface ResponseSchema {
  payload: {
    weightedAveragePrice: number
    amount: number
    timestamp: number
    datetime: string
    baseAsset: string
    quoteAsset: string
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const url = `/v1/exchange-rates/${coin}/${market}`

  const reqConfig = { ...config.api, url }

  const response = await HTTP.request<ResponseSchema>(reqConfig)
  const result = HTTP.validateResultNumber(response.data, ['payload', 'weightedAveragePrice'])
  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
