import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['price', 'forex']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to'],
    description: ' The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
  quantity: {
    description: 'An additional amount of the original currency',
    type: 'number',
    default: 1,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = `/convert`
  const from = (validator.overrideSymbol(AdapterName) as string).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const quantity = validator.validated.data.quantity

  const params = {
    ...config.api.params,
    from,
    to,
    quantity,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['value'])

  return Requester.success(jobRunID, response, config.verbose)
}
