import { ExecuteWithConfig, Config } from '@chainlink/types'
import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const NAME = 'coin'

export enum Paths {
  Price = 'price',
  MarketCap = 'marketcap',
}

const customParams = {
  base: ['base', 'from', 'coin'],
  coinid: false,
  path: false,
}

const referenceSymbolToUuid = async (symbol: string, config: Config): Promise<string> => {
  const url = 'reference-currencies'
  const options = {
    ...config.api,
    url,
  }
  const response = await Requester.request(options)
  const currency = response.data.data.currencies.find(
    (x: Record<string, unknown>) => (x['symbol'] as string).toLowerCase() === symbol.toLowerCase(),
  )
  if (!currency) throw Error(`Currency not found for symbol: ${symbol}`)
  return currency.uuid
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName) as string
  const coinid = validator.validated.data.coinid as string | undefined
  const path = validator.validated.data.path || Paths.Price

  // If coinid was provided or base was overridden, that symbol will be fetched
  let coin = coinid || (symbol !== validator.validated.data.base && symbol)
  let cost = 1
  if (!coin) {
    try {
      coin = await referenceSymbolToUuid(symbol, config)
      cost = 2
    } catch (e) {
      throw new AdapterError({ jobRunID, statusCode: 400, message: e.message })
    }
  }

  const url = `coin/${coin}`
  const options = {
    ...config.api,
    url,
  }

  const resultPaths: { [key: string]: string[] } = {
    [Paths.Price]: ['data', 'coin', 'price'],
    [Paths.MarketCap]: ['data', 'coin', 'marketCap'],
  }
  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, resultPaths[path])
  response.data.cost = cost

  return Requester.success(jobRunID, response, config.verbose)
}
