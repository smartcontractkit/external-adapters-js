import { Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  Config,
  AxiosResponse,
  AdapterRequest,
  InputParameters,
} from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['crypto', 'price', 'marketcap']

export const endpointResultPaths = {
  crypto: 'price',
  price: 'price',
  marketcap: 'marketc_ap',
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

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin', 'ids'],
  quote: ['quote', 'to', 'market', 'convert'],
  resultPath: false,
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
  resultPath: string,
) => {
  const payload: [AdapterRequest, number][] = []
  for (const i in response.data) {
    const entry = response.data[i]
    payload.push([
      { ...request, data: { ...request.data, base: entry.symbol.toUpperCase() } },
      Requester.validateResultNumber(response.data[i], resultPath),
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

  if (Array.isArray(symbol)) return handleBatchedRequest(jobRunID, request, response, resultPath)

  const result = Requester.validateResultNumber(response.data[0], resultPath)
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose, [
    'base',
  ])
}
