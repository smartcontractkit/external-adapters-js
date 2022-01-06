import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

const DEFAULT_AMOUNT = 1
const DEFAULT_PRECISION = 6

export const supportedEndpoints = ['forex', 'price']

export interface ErrorResponseSchema {
  status: string
  request_id: string
  error: string
}

const customError = (data: ErrorResponseSchema) => {
  return data.status === 'ERROR'
}

export const inputParameters: InputParameters = {
  base: ['base', 'from'],
  quote: ['quote', 'to'],
  amount: false,
  precision: false,
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

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, ['converted'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
