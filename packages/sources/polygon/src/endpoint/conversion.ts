import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

const DEFAULT_AMOUNT = 1
const DEFAULT_PRECISION = 6

export const supportedEndpoints = ['conversion']

export interface ErrorResponseSchema {
  status: string
  request_id: string
  error: string
}

const customError = (data: ResponseSchema | ErrorResponseSchema) => data.status === 'ERROR'

export const description = 'Get FOREX price conversions'

export type TInputParameters = { base: string; quote: string; amount: number; precision: number }
export const inputParameters: InputParameters<TInputParameters> = {
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

export interface ResponseSchema {
  converted: number
  from: string
  initialAmount: number
  last: { ask: number; bid: number; exchange: number; timestamp: number }
  request_id: string
  status: string
  symbol: string
  to: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters)

  const jobRunID = validator.validated.id
  const from = validator.overrideSymbol(AdapterName, validator.validated.data.base).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const amount = validator.validated.data.amount || DEFAULT_AMOUNT
  const precision = validator.validated.data.precision || DEFAULT_PRECISION
  const url = util.buildUrlPath('/v1/conversion/:from/:to', { from, to })

  const params = {
    ...config.api?.params,
    amount,
    precision,
  }

  const options = { ...config.api, params, url }
  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, ['converted'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
