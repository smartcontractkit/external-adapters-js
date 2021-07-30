import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['coin', 'price', 'marketcap']

export const endpointResultPaths = {
  coin: 'data.coin.price',
  price: 'data.coin.price',
  marketcap: 'data.coin.marketCap',
}

export interface ResponseSchema {
  data: {
    coin: {
      '24hVolume': string
      allTimeHigh: { price: string; timestamp: number }
      btcPrice: string
      change: string
      coinrankingUrl: string
      color: string
      description: string
      iconUrl: string
      links: { name: string; type: string; url: string }[]
      lowVolume: boolean
      marketCap: string
      name: string
      numberOfExchanges: number
      numberOfMarkets: number
      price: string
      rank: number
      sparkline: string[]
      supply: { confirmed: boolean; total: string; circulating: string }
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

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  coinid: false,
  resultPath: false,
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
  const symbol = validator.overrideSymbol(AdapterName) as string
  const coinid = validator.validated.data.coinid as string | undefined
  const resultPath = validator.validated.data.resultPath

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

  const response = await Requester.request<ResponseSchema & { cost?: number }>(options)
  response.data.cost = cost
  const result = Requester.validateResultNumber(response.data, [resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
