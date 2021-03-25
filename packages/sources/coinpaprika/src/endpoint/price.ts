import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

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

const getCoinId = async (ticker: string): Promise<string> => {
  const response = await Requester.request({
    url: 'https://api.coinpaprika.com/v1/coins',
  })
  const coin = response.data
    .sort((a: { rank: number }, b: { rank: number }) => (a.rank > b.rank ? 1 : -1))
    .find(
      (x: { symbol: string; rank: number }) =>
        x.symbol.toLowerCase() === ticker.toLowerCase() && x.rank !== 0,
    )
  if (typeof coin?.id === 'undefined') {
    throw new Error('Coin id not found')
  }
  return coin.id.toLowerCase()
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName)
  const quote = validator.validated.data.quote
  const coinid = validator.validated.data.coinid as string | undefined

  // If coinid was provided or base was overridden, that symbol will be fetched
  let coin = coinid || (symbol !== validator.validated.data.base && symbol)
  if (!coin) {
    try {
      coin = await getCoinId(symbol)
    } catch (e) {
      throw new AdapterError({ jobRunID, statusCode: 400, message: e.message })
    }
  }

  const url = `v1/tickers/${coin.toLowerCase()}`
  const market = validator.validated.data.quote
  const path = validator.validated.data.path || Paths.Price

  const params = {
    quotes: quote.toUpperCase(),
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
  response.data.result = Requester.validateResultNumber(response.data, resultPaths[path])
  response.data.cost = 2

  return Requester.success(jobRunID, response, config.verbose)
}
