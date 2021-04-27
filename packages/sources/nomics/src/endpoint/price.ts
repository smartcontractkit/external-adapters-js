import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const NAME = 'price'

export enum Paths {
  Price = 'price',
  MarketCap = 'marketcap',
}

type PriceResponse = {
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
}[]

const customError = (data: PriceResponse) => data.length === 0

const customParams = {
  base: ['base', 'from', 'coin', 'ids'],
  quote: ['quote', 'to', 'market', 'convert'],
  path: false,
}

const convertId: Record<string, string> = {
  FNX: 'FNX2',
  AMP: 'AMP2',
  WING: 'WING2',
  FTT: 'FTXTOKEN',
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
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

  const resultPaths: { [key: string]: string[] } = {
    [Paths.Price]: ['price'],
    [Paths.MarketCap]: ['market_cap'],
  }

  const response = await Requester.request<
    PriceResponse & { result?: number; results?: { [symbol: string]: number } }
  >(reqConfig, customError)

  if (Array.isArray(symbol)) {
    const payload: Record<string, number> = {}
    for (const i in response.data) {
      const entry = response.data[i]
      payload[entry.symbol] = Requester.validateResultNumber(response.data[i], resultPaths[path])
    }

    ;(response.data as any) = { results: payload }
    return Requester.success(jobRunID, response, true)
  }

  response.data.result = Requester.validateResultNumber(response.data[0], resultPaths[path])
  return Requester.success(jobRunID, response, config.verbose)
}
