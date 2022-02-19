import { Requester, Validator, CacheKey } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  InputParameters,
  AdapterRequest,
  AxiosResponse,
  AdapterBatchResponse,
} from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['live', 'forex', 'price']
export const batchablePropertyPath = [{ name: 'quote' }]

const customError = (data: ResponseSchema) => !data.success

export const description =
  'Returns a batched price comparison from one currency to a list of other currencies.'

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  amount: false,
}

export interface ResponseSchema {
  success: boolean
  terms: string
  privacy: string
  timestamp: number
  source: string
  quotes: { [key: string]: string }
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  resultPath: string,
  symbols: string[],
) => {
  const payload: AdapterBatchResponse = []
  for (const symbol of symbols) {
    const from = response.data.source

    const individualRequest = {
      ...request,
      data: { ...request.data, base: from.toUpperCase(), quote: symbol.toUpperCase() },
    }

    const result = Requester.validateResultNumber(response.data, [resultPath, from + symbol])

    payload.push([
      CacheKey.getCacheKey(individualRequest, inputParameters),
      individualRequest,
      result,
    ])
  }
  return Requester.success(
    jobRunID,
    Requester.withResult(response, undefined, payload),
    true,
    batchablePropertyPath,
  )
}

// NOTE: This endpoint has not been acceptance tested and will need to be once
// a valid API Key is obtained.
export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const from = validator.overrideSymbol(AdapterName)
  const to = validator.validated.data.quote
  const url = `live`
  const currencies = Array.isArray(to) ? to.join() : to

  const params = {
    access_key: config.apiKey,
    source: from,
    currencies,
  }

  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(reqConfig, customError)
  if (Array.isArray(to)) return handleBatchedRequest(jobRunID, request, response, 'quotes', to)

  const result = Requester.validateResultNumber(response.data, ['quotes', from + to])
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
