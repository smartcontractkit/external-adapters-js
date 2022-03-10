import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['crypto', 'price']

export const description =
  '**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**'

export const inputParameters: InputParameters = {
  symbol: {
    aliases: ['base', 'from', 'coin', 'sym'],
    type: 'string',
    required: true,
    description: 'The symbol of the currency to query',
  },
  convert: {
    aliases: ['quote', 'to', 'market'],
    type: 'string',
    required: true,
    description: 'The symbol of the currency to convert to',
  },
}

export interface ResponseSchema {
  data: { base: string; currency: string; amount: string }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol
  const convert = validator.validated.data.convert
  const currencyPair = `${symbol}-${convert}`.toUpperCase()
  const url = util.buildUrlPath('/v2/prices/:currencyPair/spot', { currencyPair })

  const params = {
    symbol,
    convert,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['data', 'amount'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
