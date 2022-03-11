import {
  AdapterRequest,
  AxiosResponse,
  Config,
  ExecuteWithConfig,
  InputParameters,
} from '@chainlink/types'
import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { NAME } from '../config'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['stock']
export const batchablePropertyPath = [{ name: 'base' }]

export const description = `https://finage.co.uk/docs/api/stock-last-quote
The result will be calculated as the midpoint between the ask and the bid.`

export const inputParameters: InputParameters = {
  base: {
    required: true,
    aliases: ['from', 'symbol'],
    description: 'The symbol of the currency to query',
  },
}

export interface ResponseSchema {
  symbol: string
  ask: number
  bid: number
  asize: number
  bsize: number
  timestamp: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base
  const symbol = Array.isArray(base)
    ? base.map((symbol) => symbol.toUpperCase()).join(',')
    : (validator.overrideSymbol(NAME) as string).toUpperCase()

  const url = getStockURL(base, symbol)
  const params = {
    apikey: config.apiKey,
    ...(Array.isArray(base) ? { symbols: symbol } : null),
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)
  if (Array.isArray(base)) {
    return handleBatchedRequest(jobRunID, request, response, validator)
  }

  const result = Requester.validateResultNumber(response.data, ['bid'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}

const getStockURL = (base: string | string[], symbol: string) => {
  if (Array.isArray(base)) {
    return util.buildUrlPath('/last/stocks')
  }
  return util.buildUrlPath('/last/stock/:symbol', { symbol })
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  validator: Validator,
) => {
  const payload: [AdapterRequest, number][] = []
  for (const base in response.data) {
    const symbol = validator.overrideReverseLookup(NAME, 'overrides', response.data[base].symbol)

    const ask = Requester.validateResultNumber(response.data, [base, 'ask'])
    const bid = Requester.validateResultNumber(response.data, [base, 'bid'])
    const result = (ask + bid) / 2

    payload.push([
      {
        ...request,
        data: {
          ...request.data,
          base: symbol.toUpperCase(),
        },
      },
      result,
    ])
  }
  response.data.result = payload
  return Requester.success(jobRunID, response)
}
