import { Requester, Validator, CacheKey } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  AxiosResponse,
  AdapterRequest,
  InputParameters,
  AdapterBatchResponse,
} from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['crypto', 'price', 'marketcap', 'volume']
export const batchablePropertyPath = [{ name: 'base' }]

export const endpointResultPaths = {
  crypto: 'price',
  price: 'price',
  marketcap: 'market_cap',
  volume: ['1d', 'volume'],
}

interface ResponseSchema {
  id: string
  currency: string
  symbol: string
  name: string
  logo_url: string
  status: string
  price: string
  price_date: string
  price_timestamp: string
  circulating_supply: string
  max_supply: string
  market_cap: string
  num_exchanges: string
  num_pairs: string
  num_pairs_unmapped: string
  first_candle: string
  first_trade: string
  first_order_book: string
  rank: string
  rank_delta: string
  high: string
  high_timestamp: string
  '1d': {
    volume: string
    price_change: string
    price_change_pct: string
    volume_change: string
    volume_change_pct: string
    market_cap_change: string
    market_cap_change_pct: string
  }
  '7d': {
    volume: string
    price_change: string
    price_change_pct: string
    volume_change: string
    volume_change_pct: string
    market_cap_change: string
    market_cap_change_pct: string
  }
  '30d': {
    volume: string
    price_change: string
    price_change_pct: string
    volume_change: string
    volume_change_pct: string
    market_cap_change: string
    market_cap_change_pct: string
  }
  '365d': {
    volume: string
    price_change: string
    price_change_pct: string
    volume_change: string
    volume_change_pct: string
    market_cap_change: string
    market_cap_change_pct: string
  }
  ytd: {
    volume: string
    price_change: string
    price_change_pct: string
    volume_change: string
    volume_change_pct: string
    market_cap_change: string
    market_cap_change_pct: string
  }
}

const customError = (data: ResponseSchema[]) => data.length === 0

export const description = `The \`crypto\` endpoint fetches the price of a requested asset, the \`marketcap\` endpoint fetches the market cap of the requested asset, and the \`volume\` endpoint fetches the volume of the requested pair of assets for past 24-hr.

**NOTE: the \`price\` endpoint is temporarily still supported, however, is being deprecated. Please use the \`crypto\` endpoint instead.**`

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin', 'ids'],
    required: true,
    description: 'The symbol of the currency to query',
  },
  quote: {
    aliases: ['to', 'market', 'convert'],
    required: true,
    description: 'The symbol of the currency to convert to',
  },
}

const convertId: Record<string, string> = {
  FNX: 'FNX2',
  AMP: 'AMP2',
  WING: 'WING2',
  FTT: 'FTXTOKEN',
  KNC: 'KNC3',
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema[]>,
  validator: Validator,
  resultPath: string,
) => {
  const payload: AdapterBatchResponse = []

  for (const i in response.data) {
    const entry = response.data[i]

    const individualRequest = {
      ...request,
      data: {
        ...request.data,
        base: validator.overrideReverseLookup(AdapterName, 'overrides', entry.symbol).toUpperCase(),
      },
    }

    const result = Requester.validateResultNumber(response.data[i], [resultPath])

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

  const symbol = validator.overrideSymbol(AdapterName)
  const symbols = Array.isArray(symbol) ? symbol : [symbol]
  const convert = validator.validated.data.quote.toUpperCase()
  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath

  const url = `/currencies/ticker`
  // Correct common tickers that are misidentified
  const ids = symbols
    .map((symbol) => convertId[symbol.toUpperCase()] || symbol.toUpperCase())
    .join(',')

  const params = {
    ids,
    convert,
    key: config.apiKey,
  }
  const reqConfig = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema[]>(reqConfig, customError)

  if (Array.isArray(symbol))
    return handleBatchedRequest(jobRunID, request, response, validator, resultPath)

  const result = Requester.validateResultNumber(response.data[0], resultPath)
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
