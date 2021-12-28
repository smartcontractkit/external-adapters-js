import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['convert', 'price']

const customError = (data: any) => data.Response === 'Error'

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
  amount: {
    description: ' An amount of the currency',
    required: false,
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = `/convert`
  const from = (validator.overrideSymbol(AdapterName) as string).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const amount = validator.validated.data.amount || 1

  const params = {
    ...config.api.params,
    from,
    to,
    amount,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['result'])

  return Requester.success(jobRunID, response, config.verbose)
}
