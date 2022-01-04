import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['crypto', 'price']

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

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol
  const convert = validator.validated.data.convert
  const currencyPair = `${symbol}-${convert}`.toUpperCase()
  const url = `/v2/prices/${currencyPair}/spot`

  const params = {
    symbol,
    convert,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['data', 'amount'])

  return Requester.success(jobRunID, response, config.verbose)
}
