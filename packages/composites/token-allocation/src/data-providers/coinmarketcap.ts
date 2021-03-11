import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

// Coin IDs fetched from the ID map: https://coinmarketcap.com/api/documentation/v1/#operation/getV1CryptocurrencyMap
const presetIds: { [symbol: string]: number } = {
  COMP: 5692,
  BNT: 1727,
  RCN: 2096,
  UNI: 7083,
  CRV: 6538,
  FNX: 5712,
  ETC: 1321,
  BAT: 1697,
  CRO: 3635,
  LEO: 3957,
  FTT: 4195,
  HT: 2502,
  OKB: 3897,
  KCS: 2087,
  BTC: 1,
  ETH: 1027,
  BNB: 1839,
  LINK: 1975,
  BCH: 1831,
  MKR: 1518,
  AAVE: 7278,
  UMA: 5617,
  SNX: 2586,
  REN: 2539,
  KNC: 1982,
  SUSHI: 6758,
  YFI: 5864,
  BAL: 5728,
  '1INCH': 8104,
}

const getPriceData = async (assets: string[], convert: string) => {
  const _getPriceData = async (params: any): Promise<any> => {
    const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
    const headers = {
      'X-CMC_PRO_API_KEY': util.getRandomRequiredEnv('API_KEY'),
    }
    const config = {
      url,
      headers,
      params,
    }
    const response = await Requester.request(config)
    return response.data
  }

  // We map some symbols as slugs
  const ids = assets.map((s) => presetIds[s]).filter(Boolean)
  const symbols = assets.filter((s) => !presetIds[s])

  let data: Record<string, any> = {}

  // We need to make two separate requests, one querying slugs
  if (ids.length > 0) {
    const idPrices = await _getPriceData({ id: ids.join(), convert })
    data = { ...data, ...idPrices.data }
  }

  // The other one querying symbols
  if (symbols.length > 0) {
    const symbolPrices = await _getPriceData({ symbol: symbols.join(), convert })
    data = { ...data, ...symbolPrices.data }
  }

  return data
}

const toAssetPrice = (data: Record<string, any>, currency: string) => {
  const price = data.quote && data.quote[currency].price
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

const toMarketCap = (data: Record<string, any>, currency: string) => {
  const marketCap = data.quote && data.quote[currency].market_cap
  if (!marketCap || marketCap <= 0) {
    throw new Error('invalid marketCap')
  }
  return marketCap
}

export const getPrices = async (
  baseSymbols: string[],
  quote: string,
): Promise<Record<string, number>> => {
  quote = quote.toUpperCase()

  const assets = baseSymbols.map((symbol) => symbol.toUpperCase())
  const pricesData = await getPriceData(assets, quote)

  const indexMap = new Map()
  Object.values(pricesData).forEach((asset) => indexMap.set(asset.symbol.toUpperCase(), asset))
  const entries = assets.map((symbol) => [symbol, toAssetPrice(indexMap.get(symbol), quote)])
  return Object.fromEntries(entries)
}

export const getMarketCaps = async (
  baseSymbols: string[],
  quote: string,
): Promise<Record<string, number>> => {
  quote = quote.toUpperCase()

  const assets = baseSymbols.map((symbol) => symbol.toUpperCase())
  const pricesData = await getPriceData(assets, quote)

  const indexMap = new Map()
  Object.values(pricesData).forEach((asset) => indexMap.set(asset.symbol.toUpperCase(), asset))
  const entries = assets.map((symbol) => [symbol, toMarketCap(indexMap.get(symbol), quote)])
  return Object.fromEntries(entries)
}
