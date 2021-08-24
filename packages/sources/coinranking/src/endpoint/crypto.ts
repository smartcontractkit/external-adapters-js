import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['crypto', 'price', 'marketcap']

export const endpointResultPaths = {
  crypto: 'price',
  price: 'price',
  marketcap: 'marketCap',
}

export interface ResponseSchema {
  data: {
    coins: {
      '24hVolume': string
      btcPrice: string
      change: string
      coinrankingUrl: string
      color: string
      iconUrl: string
      listedAt: number
      lowVolume: boolean
      marketCap: string
      name: string
      price: string
      rank: number
      sparkline: string[]
      symbol: string
      tier: number
      uuid: string
    }[]
    stats: {
      total: number
      total24hVolume: string
      totalExchanges: number
      totalMarketCap: string
      totalMarkets: number
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

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false,
  resultPath: false,
  referenceCurrencyUuid: false,
}

const referenceSymbolToUuid = async (symbol: string, config: Config): Promise<string> => {
  const url = 'reference-currencies'
  const options = {
    ...config.api,
    url,
  }
  const response = await Requester.request<ReferenceCurrenciesResponseSchema>(options)
  const currency = response.data.data.currencies.find(
    (x) => x.symbol.toLowerCase() === symbol.toLowerCase(),
  )
  if (!currency) throw Error(`Currency not found for symbol: ${symbol}`)
  return currency.uuid
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base
  const quote = validator.validated.data.quote
  const coinid = validator.validated.data.coinid
  const overridenCoinid = validator.overrideSymbol(AdapterName) as string
  let referenceCurrencyUuid = validator.validated.data.referenceCurrencyUuid as string | undefined
  const resultPath = validator.validated.data.resultPath

  let cost = 1
  if (!referenceCurrencyUuid && quote.toUpperCase() !== 'USD') {
    referenceCurrencyUuid = await referenceSymbolToUuid(quote, config)
    cost = 2
  }

  const params = { symbols: [symbol], referenceCurrencyUuid }

  const url = 'coins'
  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema & { cost?: number }>(options)

  // If coinid was provided or base was overridden, that UUID will be fetched
  const coinUuid = coinid || (overridenCoinid !== symbol && overridenCoinid)
  const coindata = response.data.data.coins.find((coin) => {
    if (coinUuid && coin.uuid === coinUuid) return true
    else if (!coinUuid && coin.symbol.toUpperCase() === symbol.toUpperCase()) return true
    return false
  })
  if (!coindata) {
    throw new Error(`Unable to find coin: ${coinUuid || symbol}`)
  }

  const result = Requester.validateResultNumber(coindata, resultPath)
  response.data.cost = cost
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
