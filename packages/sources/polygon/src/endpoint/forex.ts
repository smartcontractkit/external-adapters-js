import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

const DEFAULT_AMOUNT = 1
const DEFAULT_PRECISION = 6

export const supportedEndpoints = ['forex', 'price']

const customError = (data: any) => {
  return data.status === 'ERROR'
}

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from'],
    required: true,
    description: 'The symbol of the currency to query',
    type: 'string',
  },
  quote: {
    aliases: ['to'],
    required: true,
    description: 'The symbol of the currency to convert to',
    type: 'string',
  },
  amount: {
    required: false,
    description: 'The amount of the `base` to convert ',
    default: 1,
    type: 'number',
  },
  precision: {
    required: false,
    description: 'The number of significant figures to include',
    default: 6,
    type: 'number',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const from = (validator.overrideSymbol(AdapterName) as string).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const amount = validator.validated.data.amount || DEFAULT_AMOUNT
  const precision = validator.validated.data.precision || DEFAULT_PRECISION
  const url = `conversion/${from}/${to}`

  const params = {
    ...config.api.params,
    amount,
    precision,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['converted'])
  return Requester.success(jobRunID, response, config.verbose)
}
