import { Requester, Validator, CacheKey } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  InputParameters,
  AxiosResponse,
  AdapterRequest,
  EndpointResultPaths,
  AdapterBatchResponse,
} from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['price', 'crypto', 'stock', 'forex', 'commodities']
export const batchablePropertyPath = [{ name: 'base', limit: 120 }]

const customError = (data: { status: string }) => data.status !== 'OK'

export const inputParameters: InputParameters = {
  base: {
    required: true,
    aliases: ['from', 'coin', 'market'],
    description: 'The symbol of the currency to query',
  },
}

const quoteEventSymbols: { [key: string]: boolean } = {
  'USO/USD:AFX': true,
}

const getBase = (request: AdapterRequest) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })
  if (validator.error) throw validator.error
  return validator.validated.data.base
}

const getSymbol = (base: string | string[]): string =>
  Array.isArray(base) ? base.map((symbol) => symbol.toUpperCase()).join(',') : base.toUpperCase()

const getResultPath = (base: string | string[]): Array<string | number> => {
  const symbol = getSymbol(base)
  const events = quoteEventSymbols[symbol] ? 'Quote' : 'Trade'
  const path = events === 'Quote' ? 'bidPrice' : 'price'
  if (Array.isArray(base)) return [events, symbol, 0, path]
  return [events, symbol, path]
}

const buildResultPath = (request: AdapterRequest): Array<string | number> => {
  const base = getBase(request)
  return getResultPath(base)
}

export const endpointResultPaths: EndpointResultPaths = {
  price: buildResultPath,
  crypto: buildResultPath,
  stock: buildResultPath,
  forex: buildResultPath,
  commodities: buildResultPath,
}

export interface ResponseSchema {
  status: string
  Trade: {
    [key: string]: {
      eventSymbol: string
      eventTime: number
      time: number
      timeNanoPart: number
      sequence: number
      exchangeCode: string
      price: number
      change: number
      size: number
      dayVolume: number
      dayTurnover: number
      tickDirection: string
      extendedTradingHours: boolean
    }
  }
}
export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(config.name || AdapterName)
  const symbol = getSymbol(base)

  const events = quoteEventSymbols[symbol] ? 'Quote' : 'Trade'
  const url = 'events.json'

  const params = {
    events,
    symbols: symbol,
  }

  const options = {
    ...config.api,
    url,
    params,
  }
  const response = await Requester.request<ResponseSchema>(options, customError)

  if (Array.isArray(base)) {
    return handleBatchedRequest(jobRunID, request, response, events)
  }

  // NOTE: may need to force entries quoteEventSymbols to not use batching

  const result = Requester.validateResultNumber(response.data, getResultPath(base))
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  events: string,
) => {
  const payload: AdapterBatchResponse = []
  for (const base in response.data[events]) {
    const individualRequest = {
      ...request,
      data: {
        ...request.data,
        base: response.data[events][base],
      },
    }
    payload.push([
      CacheKey.getCacheKey(individualRequest, inputParameters),
      individualRequest,
      Requester.validateResultNumber(response.data, getResultPath(base)),
    ])
  }
  return Requester.success(
    jobRunID,
    Requester.withResult(response, undefined, payload),
    true,
    batchablePropertyPath,
  )
}
