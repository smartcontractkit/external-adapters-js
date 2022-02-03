import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['crypto', 'ticker']

export const description =
  '**NOTE: the `ticker` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**'

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin', 'fsym'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market', 'tsym'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
}

export const endpointResultPaths = {
  crypto: 'last',
  ticker: 'last',
}

interface ResponseSchema {
  ask: string
  bid: string
  last: string
  low: string
  high: string
  open: string
  volume: string
  volume_quote: string
  timestamp: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const resultPath = validator.validated.data.resultPath
  const market = base + quote
  const url = `public/ticker/${market}`

  const options = {
    ...config.api,
    url,
  }

  const response = await HTTP.request<ResponseSchema>(options)
  const result = HTTP.validateResultNumber(response.data, [resultPath])
  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
