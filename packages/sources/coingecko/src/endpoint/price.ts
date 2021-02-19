import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config, ResponsePayload } from '@chainlink/types'

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

const blacklist = ['leocoin', 'farmatrust', 'freetip', 'compound-coin', 'uni-coin', 'unicorn-token']

const getCoinList = async (config: Config) => {
  const url = '/coins/list'
  const options = {
    ...config.api,
    url,
  }
  const response = await Requester.request(options, customError)
  return response.data
}

const getPriceData = async (config: Config, ids: string, currency: string) => {
  const url = '/simple/price'
  const params = {
    ids,
    vs_currencies: currency.toLowerCase(),
  }
  const options = {
    ...config.api,
    url,
    params,
  }
  const response = await Requester.request(options)
  return response.data
}

const getIdtoSymbol = (symbols: string[], coinList: any) => {
  return Object.fromEntries(
    symbols.map((symbol) => {
      if (symbol in presetTickers) {
        return [presetTickers[symbol], symbol]
      }
      const coin = coinList.find(
        (d: any) =>
          d.symbol.toLowerCase() === symbol.toLowerCase() &&
          !blacklist.includes(d.id.toLowerCase()),
      )
      return [coin.id, symbol]
    }),
  )
}

const getPayload = (symbols: string[], prices: { [key: string]: any }, quote: string) => {
  const payloadEntries = symbols.map((symbol) => {
    const key = symbol
    const val = {
      quote: {
        [quote]: { price: prices[symbol] },
      },
    }
    return [key, val]
  })

  const payload: ResponsePayload = Object.fromEntries(payloadEntries)
  return payload
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base
  const symbols = Array.isArray(base) ? base : [base]
  const coingeckoSymbolId = validator.validated.data.coinid
  const quote = validator.validated.data.quote

  const coinList = await getCoinList(config)
  const idToSymbol = getIdtoSymbol(symbols, coinList)
  const ids = coingeckoSymbolId
    ? coingeckoSymbolId.toLowerCase()
    : Object.keys(idToSymbol).join(',')

  const response: Record<string, any> = await getPriceData(config, ids, quote)
  const prices = Object.fromEntries(
    Object.entries(response).map(([coinId, data]) => [
      idToSymbol[coinId],
      Requester.validateResultNumber(data, [quote.toLowerCase()]),
    ]),
  )

  const result = symbols.length === 1 && prices[symbols[0]]
  const payload = getPayload(symbols, prices, quote)
  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result, payload } : { result, payload },
    result,
    status: 200,
  })
}
