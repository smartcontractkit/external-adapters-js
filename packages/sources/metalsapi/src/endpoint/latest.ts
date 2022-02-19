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

export const supportedEndpoints = ['latest']
export const batchablePropertyPath = [{ name: 'quote' }]

export const description =
  'Returns a batched price comparison from one currency to a list of other currencies.'

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
  },
}
export interface ResponseSchema {
  success: true
  timestamp: string
  date: string
  base: string
  rates: {
    [key: string]: number
  }
  unit: string
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  resultPath: string,
  symbols: string[],
) => {
  const payload: AdapterBatchResponse = []
  const base = response.data.base.toUpperCase()

  for (const symbol of symbols) {
    const individualRequest = {
      ...request,
      data: { ...request.data, base, quote: symbol.toUpperCase() },
    }

    const result = Requester.validateResultNumber(response.data, [resultPath, symbol])

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

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName)
  const to = validator.validated.data.quote
  const url = `latest`

  const params = {
    access_key: config.apiKey,
    base,
    symbols: Array.isArray(to) ? to.join(',') : to,
  }

  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(reqConfig)
  if (Array.isArray(to)) return handleBatchedRequest(jobRunID, request, response, 'rates', to)

  const result = Requester.validateResultNumber(response.data, ['rates', to])
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
