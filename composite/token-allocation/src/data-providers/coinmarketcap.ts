import { Requester } from '@chainlink/external-adapter'

// Defaults we use when there are multiple currencies with the same symbol
const presetSlugs: Record<string, string> = {
  COMP: 'compound',
  BNT: 'bancor',
  RCN: 'ripio-credit-network',
  UNI: 'uniswap',
  CRV: 'curve-dao-token',
  FNX: 'finnexus',
  ETC: 'ethereum-classic',
  BAT: 'basic-attention-token',
}

const getPriceData = async (assets: string[], convert: string) => {
  const _getPriceData = async (params: any): Promise<any> => {
    const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
    const headers = {
      'X-CMC_PRO_API_KEY': process.env.API_KEY,
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
  const slugs = assets.map((s) => presetSlugs[s]).filter(Boolean)
  const symbols = assets.filter((s) => !presetSlugs[s])

  let data: Record<string, any> = {}

  // We need to make two separate requests, one querying slugs
  if (slugs.length > 0) {
    const slugPrices = await _getPriceData({ slug: slugs.join(), convert })
    data = { ...data, ...slugPrices.data }
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
  return { ...Object.fromEntries(entries), cost: 2 }
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
