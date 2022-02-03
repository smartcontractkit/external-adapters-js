import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['convert']

const customError = (data: ResponseSchema) => !data.success

export const inputParameters: InputParameters = {
  base: {
    required: true,
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    type: 'string',
  },
  quote: {
    required: true,
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    type: 'string',
  },
  amount: {
    required: false,
    description: 'The amount of `base` currency',
    type: 'number',
    default: 1,
  },
}

interface ResponseSchema {
  success: boolean
  query: { from: string; to: string; amount: number }
  info: { timestamp: number; rate: number }
  date: string
  result: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = `/api/convert`
  const from = (validator.overrideSymbol(AdapterName) as string).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const amount = validator.validated.data.amount

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

  const response = await HTTP.request<ResponseSchema>(options, customError)
  const result = HTTP.validateResultNumber(response.data, ['result'])

  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
