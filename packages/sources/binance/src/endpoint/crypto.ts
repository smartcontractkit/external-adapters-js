import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['crypto', 'ticker']

export const description =
  '**Note: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**'

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
  symbol: string
  price: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  let base = validator.overrideSymbol(AdapterName)
  if (Array.isArray(base)) base = base[0]
  const quote = validator.validated.data.quote
  const symbol = `${base.toUpperCase()}${quote.toUpperCase()}`
  const url = `/api/v3/ticker/price`

  const params = {
    symbol,
  }

  const options = { ...config.api, params, url }

  const response = await HTTP.request<ResponseSchema>(options)
  const result = HTTP.validateResultNumber(response.data, ['price'])

  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
