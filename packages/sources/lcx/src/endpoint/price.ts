import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['price']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query, one of `BTC` or `ETH`',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to, one of `USD` or `EUR`',
    required: true,
  },
  endpoint: {
    required: false,
    description: 'Optional endpoint param',
    default: 'price',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base.toUpperCase()
  const currency = validator.validated.data.quote.toUpperCase()

  const params = {
    coin,
    currency,
  }

  const options = {
    ...config.api,
    params,
  }

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, ['data', 'Price'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
