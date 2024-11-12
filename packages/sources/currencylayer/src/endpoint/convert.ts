import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['convert']

const customError = (data: ResponseSchema) => !data.success

export type TInputParameters = { base: string; quote: string; amount: number }
export const inputParameters: InputParameters<TInputParameters> = {
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
    description: 'An amount of the currency',
    required: false,
    type: 'number',
    default: 1,
  },
}

export interface ResponseSchema {
  success: boolean
  terms: string
  privacy: string
  query: { from: string; to: string; amount: number }
  info: { timestamp: number; quote: number }
  result: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = `/convert`
  const from = validator
    .overrideSymbol<string>(AdapterName, validator.validated.data.base)
    .toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const amount = validator.validated.data.amount

  const params = {
    ...config.api?.params,
    from,
    to,
    amount,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, ['result'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
