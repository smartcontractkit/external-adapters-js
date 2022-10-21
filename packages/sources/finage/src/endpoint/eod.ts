import type {
  AxiosResponse,
  Config,
  ExecuteWithConfig,
  InputParameters,
  AdapterBatchResponse,
  AdapterRequest,
} from '@chainlink/ea-bootstrap'
import { Requester, Validator, CacheKey, util } from '@chainlink/ea-bootstrap'
import { NAME } from '../config'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['eod']
export const batchablePropertyPath = [{ name: 'base' }]

export const description = 'https://finage.co.uk/docs/api/stock-market-previous-close'

export type TInputParameters = { base: string | string[] }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    required: true,
    aliases: ['from', 'symbol'],
    description: 'The symbol of the currency to query',
  },
}

export interface ResponseSchema {
  symbol: string
  totalResults: number
  results: [
    {
      o: number
      h: number
      l: number
      c: number
      v: number
      t: number
    },
  ]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base
  const symbol = Array.isArray(base)
    ? base.map((symbol) => symbol.toUpperCase()).join(',')
    : validator.overrideSymbol(NAME, validator.validated.data.base.toString()).toUpperCase()

  const url = util.buildUrlPath('/agg/stock/prev-close/:symbol', { symbol })
  const params = {
    apikey: config.apiKey,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)

  if (Array.isArray(base)) {
    return handleBatchedRequest(jobRunID, request, response)
  }

  const result = Requester.validateResultNumber(response.data, ['results', 0, 'c'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}

// TODO: check this
const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
) => {
  const payload: AdapterBatchResponse = []

  for (const base in response.data) {
    const individualRequest = {
      ...request,
      data: {
        ...request.data,
        symbol: (response.data as any)[base].symbol,
        bid: (response.data as any)[base].bid,
      },
    }

    const result = Requester.validateResultNumber(response.data, [base, 'bid'])

    payload.push([
      CacheKey.getCacheKey(individualRequest, Object.keys(inputParameters)),
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
