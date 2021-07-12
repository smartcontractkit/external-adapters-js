import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, AxiosResponse, AdapterRequest } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['price', 'marketcap']

export enum Paths {
  Price = 'price',
  MarketCap = 'marketcap',
}

const resultPaths: { [key: string]: string[] } = {
  [Paths.Price]: ['price'],
  [Paths.MarketCap]: ['market_cap'],
}

export const endpointPaths = {
  marketcap: Paths.MarketCap
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

const inputParameters = {
  base: ['base', 'from', 'coin', 'ids'],
  quote: ['quote', 'to', 'market', 'convert'],
  path: false,
  endpoints: false
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
  path: string,
) => {
  const payload: [AdapterRequest, number][] = []
  for (const i in response.data) {
    const entry = response.data[i]
    payload.push([
      { ...request, data: { ...request.data, base: entry.symbol.toUpperCase() } },
      Requester.validateResultNumber(response.data[i], resultPaths[path]),
    ])
  }

  return Requester.success(jobRunID, Requester.withResult(response, undefined, payload), true, [
    'base',
  ])
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const symbol = validator.overrideSymbol(AdapterName)
  const symbols = Array.isArray(symbol) ? symbol : [symbol]
  const convert = validator.validated.data.quote.toUpperCase()
  const jobRunID = validator.validated.id
  const path = validator.validated.data.path || Paths.Price

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

  if (Array.isArray(symbol)) return handleBatchedRequest(jobRunID, request, response, path)

  const result = Requester.validateResultNumber(response.data[0], resultPaths[path])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose, [
    'base',
  ])
}
