import { ExecuteWithConfig, Config } from '@chainlink/types'
import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['coin', 'price', 'marketcap']

export enum Paths {
  Price = 'price',
  MarketCap = 'marketcap',
}

export const endpointPaths = {
  marketcap: Paths.MarketCap
}

export interface ResponseSchema {
  data: {
    coin: {
      "24hVolume": string
      allTimeHigh: { price: string, timestamp: number }
      btcPrice: string
      change: string
      coinrankingUrl: string
      color: string
      description: string
      iconUrl: string
      links: { name: string, type: string, url: string }[]
      lowVolume: boolean
      marketCap: string
      name: string
      numberOfExchanges: number
      numberOfMarkets: number
      price: string
      rank: number
      sparkline: string[]
      supply: { confirmed: boolean, total: string, circulating: string }
      symbol: string
      tier: number
      uuid: string
      websiteUrl: string
    }
  }
  status: string
}

interface ReferenceCurrenciesResponseSchema {
  data: {
    currencies: {
      iconUrl: string
      name: string
      sign: string
      symbol: string
      type: string
      uuid: string
    }[]
    stats: { total: number }
  }
  status: string
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
  const response = await Requester.request<ReferenceCurrenciesResponseSchema>(options)
  const currency = response.data.data.currencies.find(
    (x) => (x.symbol).toLowerCase() === symbol.toLowerCase(),
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
  const response = await Requester.request<ResponseSchema & { cost?: number }>(options)
  response.data.cost = cost
  const result = Requester.validateResultNumber(response.data, resultPaths[path])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
