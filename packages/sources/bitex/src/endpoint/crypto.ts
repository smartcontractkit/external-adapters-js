import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['crypto', 'tickers']

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

interface ResponseSchema {
  data: {
    id: string
    type: string
    attributes: {
      last: number
      open: number
      high: number
      low: number
      vwap: number
      volume: number
      bid: number
      ask: number
      price_before_last: number
    }
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base
  const quote = validator.validated.data.quote
  const resultPath = validator.validated.data.resultPath || 'vwap'
  const url = `tickers/${base}_${quote}`

  const options = {
    ...config.api,
    url,
  }

  const response = await HTTP.request<ResponseSchema>(options)
  const result = HTTP.validateResultNumber(response.data, ['data', 'attributes', resultPath])

  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
