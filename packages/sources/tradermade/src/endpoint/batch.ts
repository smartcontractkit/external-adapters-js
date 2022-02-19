import { Validator, Requester, util, CacheKey } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  AdapterRequest,
  AxiosResponse,
  InputParameters,
  AdapterBatchResponse,
} from '@chainlink/types'
import { NAME } from '../config'
import overrides from '../config/symbols.json'

/**
 * This endpoint is similar to live but is supposed to only be used to fetch forex data.  This is why quote is a required parameter.
 * The reason for this split is that we want to enable WS for this endpoint but not for live.
 */

export const supportedEndpoints = []
// NOTE: unused pending tradermade service agreement
export const batchablePropertyPath = [{ name: 'base' }, { name: 'quote' }]

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'symbol'],
    required: true,
    description: 'The symbol of the currency to query',
  },
  quote: {
    aliases: ['to', 'market', 'convert'],
    required: true,
    description: 'The quote currency',
  },
}

export interface ResponseSchema {
  endpoint: string
  quotes: Quote[]
  requested_time: string
  timestamp: number
}

export interface Quote {
  ask: number
  base_currency: string
  bid: number
  mid: number
  quote_currency: string
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  resultPath: string,
) => {
  const payload: AdapterBatchResponse = []

  for (const pair of response.data.quotes) {
    const symbol = pair.base_currency
    const to = pair.quote_currency

    const individualRequest = {
      ...request,
      data: { ...request.data, from: symbol.toUpperCase(), to: to.toUpperCase() },
    }

    const result = Requester.validateResultNumber(pair, [resultPath])

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
  const validator = new Validator(request, inputParameters, {}, { overrides })
  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(NAME)
  const to = validator.validated.data.quote || ''
  const pairArray = []

  for (const fromCurrency of util.formatArray(symbol)) {
    for (const toCurrency of util.formatArray(to)) {
      pairArray.push(`${fromCurrency.toUpperCase() + toCurrency.toUpperCase()}`)
    }
  }

  const currency = pairArray.toString()
  const params = {
    ...config.api.params,
    currency,
  }

  const options = { ...config.api, params }
  const response = await Requester.request<ResponseSchema>(options)
  if (Array.isArray(symbol) || Array.isArray(to))
    return handleBatchedRequest(jobRunID, request, response, 'mid')

  const result = Requester.validateResultNumber(response.data, ['quotes', 0, 'mid'])
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.api.verbose,
    batchablePropertyPath,
  )
}
