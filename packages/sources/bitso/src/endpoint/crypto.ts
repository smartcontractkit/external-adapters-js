import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['ticker', 'crypto']

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

const customError = (data: ResponseSchema) => data.error

export interface ResponseSchema {
  success: boolean
  payload: {
    high: string
    last: string
    created_at: string
    book: string
    volume: string
    vwap: string
    low: string
    ask: string
    bid: string
    change_24: string
  }
  error: { code: string; message: string }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath || 'vwap'
  const url = `ticker`
  const base = validator.validated.data.base.toLowerCase()
  const quote = validator.validated.data.quote.toLowerCase()
  const book = `${base}_${quote}`

  const params = { book }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await HTTP.request<ResponseSchema>(options, customError)
  const result = HTTP.validateResultNumber(response.data, ['payload', resultPath])
  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
