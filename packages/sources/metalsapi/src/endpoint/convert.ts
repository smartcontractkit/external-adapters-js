import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['convert', 'forex']

const customError = (data: ResponseSchema) => !data.success

export const inputParameters: InputParameters = {
  base: {
    required: true,
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
  },
  quote: {
    required: true,
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
  },
  amount: {
    required: false,
    type: 'number',
    description: 'The amount of the `base` currency',
    default: 1,
  },
}

export interface ResponseSchema {
  success: boolean
  query: { from: string; to: string; amount: number }
  info: { timestamp: number; rate: number }
  historical: boolean
  date: string
  result: number
  unit: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const from = (validator.overrideSymbol(AdapterName) as string).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const amount = validator.validated.data.amount
  const url = `convert`

  const params = {
    access_key: config.apiKey,
    from,
    to,
    amount,
  }

  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(reqConfig, customError)
  const result = Requester.validateResultNumber(response.data, ['result'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
