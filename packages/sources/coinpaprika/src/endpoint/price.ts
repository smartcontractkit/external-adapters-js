import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import { getCoinIds, getSymbolToId } from '../util'

export const supportedEndpoints = ['price', 'marketcap']
export enum Paths {
  Price = 'price',
  MarketCap = 'marketcap',
}

const inputParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false,
  path: false,
  endpoint: false
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const endpoint = validator.validated.data.endpoint || config.defaultEndpoint
  if (endpoint.toLowerCase() === 'marketcap') {
    validator.validated.data.path = Paths.MarketCap
  }

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName) as string
  const quote = validator.validated.data.quote
  const coinid = validator.validated.data.coinid as string | undefined

  // If coinid was provided or base was overridden, that symbol will be fetched
  let coin = coinid || (symbol !== validator.validated.data.base && symbol)
  if (!coin) {
    try {
      const coinIds = await getCoinIds(jobRunID)
      coin = await getSymbolToId(symbol, coinIds)
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
