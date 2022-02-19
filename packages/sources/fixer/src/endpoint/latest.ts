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

export const supportedEndpoints = ['latest', 'price', 'forex']
export const batchablePropertyPath = [{ name: 'quote' }]

export interface ResponseSchema {
  success: boolean
  timestamp: number
  base: string
  date: string
  rates: {
    [key: string]: number
  }
}

const customError = (data: ResponseSchema) => !data.success

export const description =
  'Returns a batched price comparison from one currency to a list of other currencies.'

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  amount: false,
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
    const from = response.data.base

    const individualRequest = {
      ...request,
      data: { ...request.data, base: from.toUpperCase(), quote: symbol.toUpperCase() },
    }

    const result = Requester.validateResultNumber(response.data, [resultPath, symbol])

    payload.push([
      CacheKey.getCacheKey(individualRequest, inputParameters),
      individualRequest,
      result,
    ])

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
  const url = `latest`

  const symbols = Array.isArray(to) ? to.join() : to

  const params = {
    access_key: config.apiKey,
    base: from,
    symbols,
  }

  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(reqConfig, customError)
  if (Array.isArray(to)) return handleBatchedRequest(jobRunID, request, response, 'rates', to)

  const result = Requester.validateResultNumber(response.data, ['rates', to])
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
