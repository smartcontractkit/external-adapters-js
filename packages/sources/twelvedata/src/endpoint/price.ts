import {
  Config,
  ExecuteWithConfig,
  InputParameters,
  Requester,
  Validator,
} from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['price', 'crypto', 'stock', 'forex', 'uk_etf', 'etf']

const customError = (data: ResponseSchema) => data.status === 'error'

export const description =
  'This `price` endpoint provides the real-time price as detailed in [Twelvedata documentation](https://twelvedata.com/docs#real-time-price).'

export type TInputParameters = { base: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin', 'market', 'symbol', 'uk_etf'],
    required: true,
    description: 'The symbol of the currency to query',
    type: 'string',
  },
}

interface ResponseSchema {
  price: string
  status: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName, validator.validated.data.base).toUpperCase()

  const url = `price`
  const params = {
    symbol,
    apikey: config.apiKey,
  }

  const options = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, ['price'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
