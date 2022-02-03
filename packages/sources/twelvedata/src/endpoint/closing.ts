import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['closing', 'eod']

const customError = (data: { status: string }) => data.status === 'error'

export const description =
  'This `closing` endpoint provides the closing price of the previous day as detailed in [Twelvedata documentation](https://twelvedata.com/docs#end-of-day-price).'

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin', 'market', 'symbol'],
    required: true,
    description: 'The symbol of the currency to query',
    type: 'string',
  },
}

interface ResponseSchema {
  symbol: string
  exchange: string
  currency: string
  datetime: string
  close: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const symbol = (validator.overrideSymbol(AdapterName) as string).toUpperCase()

  const url = `eod`
  const params = {
    symbol,
    apikey: config.apiKey,
  }

  const options = {
    ...config.api,
    params,
    url,
  }

  const response = await HTTP.request<ResponseSchema>(options, customError)

  const result = HTTP.validateResultNumber(response.data, ['close'])

  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
