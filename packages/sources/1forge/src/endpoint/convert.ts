import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, DefaultConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['convert']

export const description =
  '[`/convert`](https://1forge.com/api#convert) - Convert from one currency to another.'

export type TInputParameters = { base: string; quote: string; quantity: number }

export const inputParameters: InputParameters<TInputParameters> = {
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

const customError = (data: ResponseSchema) => !!data.error

interface ResponseSchema {
  value: string
  text: string
  timestamp: number
  error?: boolean
}

export const execute: ExecuteWithConfig<DefaultConfig> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = `/convert`
  const from = validator.overrideSymbol(AdapterName, validator.validated.data.base).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const quantity = validator.validated.data.quantity

  const params = {
    ...config.api?.params,
    from,
    to,
    quantity,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, ['value'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
