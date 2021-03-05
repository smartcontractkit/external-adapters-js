import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'price'

const customError = (data: any) => {
  if (Object.keys(data).length === 0) return true
  return false
}

export enum Paths {
  Price = 'price',
  MarketCap = 'marketcap',
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false,
  path: false,
}

const presetTickers: { [ticker: string]: string } = {
  COMP: 'compound-governance-token',
  FNX: 'finnexus',
  UNI: 'uniswap',
  GRT: 'the-graph',
  LINA: 'linear',
}

const convertFromTicker = async (config: Config, ticker: string, coinId: string) => {
  if (typeof coinId !== 'undefined') return coinId.toLowerCase()

  // Correct common tickers that are misidentified
  if (ticker in presetTickers) {
    return presetTickers[ticker]
  }

  const url = '/coins/list'

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options, customError)

  const coin = response.data.find((x: any) => x.symbol.toLowerCase() === ticker.toLowerCase())

  if (typeof coin === 'undefined') {
    return undefined
  }

  return coin.id.toLowerCase()
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base
  const coinid = validator.validated.data.coinid
  const url = '/simple/price'
  const market = validator.validated.data.quote
  const path: string = validator.validated.data.path || Paths.Price
  const coin = await convertFromTicker(config, symbol, coinid)

  const params = {
    ids: coin,
    vs_currencies: market,
    include_market_cap: path === Paths.MarketCap,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const param: { [key: string]: string } = {
    [Paths.MarketCap]: `${market.toLowerCase()}_market_cap`,
    [Paths.Price]: `${market.toLowerCase()}`,
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, [
    coin.toLowerCase(),
    param[path] || market.toLowerCase(),
  ])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result, cost: 2 } : { result, cost: 2 },
    result,
    status: 200,
  })
}
