import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'price'
export enum Paths {
  Price = 'price',
  MarketCap = 'marketcap',
}

const inputParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false,
  path: false,
}

const presetTickers: { [ticker: string]: string } = {
  GRT: 'grt-the-graph',
}

const convertFromTicker = async (ticker: string, coinId: string | undefined) => {
  if (typeof coinId !== 'undefined') return coinId.toLowerCase()

  const response = await Requester.request({
    url: 'https://api.coinpaprika.com/v1/coins',
  })
  const coin = response.data
    .sort((a: { rank: number }, b: { rank: number }) => (a.rank > b.rank ? 1 : -1))
    .find(
      (x: { symbol: string; rank: number }) =>
        x.symbol.toLowerCase() === ticker.toLowerCase() && x.rank !== 0,
    )
  // if (!coin) return callback('Could not find coin', null)
  return coin.id.toLowerCase()
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base
  const coin = await convertFromTicker(
    symbol,
    validator.validated.data.coinid || presetTickers[symbol],
  )
  const url = `v1/tickers/${coin}`
  const market = validator.validated.data.quote
  const path = validator.validated.data.path || Paths.Price

  const params = {
    quotes: market.toUpperCase(),
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const resultPaths: { [key: string]: string[] } = {
    [Paths.Price]: ['quotes', market.toUpperCase(), 'price'],
    [Paths.MarketCap]: ['quotes', market.toUpperCase(), 'market_cap'],
  }
  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, resultPaths[path])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result, cost: 2 } : { result, cost: 2 },
    result,
    status: 200,
  })
}
