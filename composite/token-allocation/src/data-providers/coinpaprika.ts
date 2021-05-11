import { Requester } from '@chainlink/external-adapter'

const directIds: { [key: string]: string } = {
  CREAM: 'cream-cream',
}

const getPriceData = async (currency: string) => {
  const url = 'https://api.coinpaprika.com/v1/tickers'
  const params = {
    quotes: currency.toUpperCase(),
  }
  const config = {
    url,
    params,
  }
  const response = await Requester.request(config)
  return response.data
}

const getPriceDataFromId = async (coinId: string, currency: string) => {
  const url = `https://api.coinpaprika.com/v1/tickers/${coinId}`
  const params = {
    quotes: currency.toUpperCase(),
  }
  const config = {
    url,
    params,
  }
  const response = await Requester.request(config)
  return response.data
}

const toAssetPrice = (data: Record<string, any>, currency: string) => {
  const price = data.quotes && data.quotes[currency.toUpperCase()].price
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

export const getPrices = async (
  baseSymbols: string[],
  quote: string,
): Promise<Record<string, number>> => {
  const priceData = await getPriceData(quote)

  // There are duplicate symbols on the response. We only want the lowest in rank
  const sortedData = priceData.sort((a: any, b: any) => a.rank - b.rank)
  const priceMap = new Map()
  for (const price of sortedData) {
    const key = price.symbol.toUpperCase()
    if (!priceMap.get(key)) {
      priceMap.set(key, price)
    }
  }

  // For coins not included in main list, check if we can query the ID
  for (const symbol of baseSymbols) {
    const key = symbol.toUpperCase()
    if (!!priceMap.get(key) || !directIds[key]) continue
    priceMap.set(symbol.toUpperCase(), await getPriceDataFromId(directIds[key], quote))
  }

  const entries = baseSymbols.map((symbol) => {
    const data = priceMap.get(symbol.toUpperCase())
    return [symbol, toAssetPrice(data, quote)]
  })

  return Object.fromEntries(entries)
}

const toMarketCap = (data: Record<string, any>, currency: string) => {
  const marketCap = data.quotes && data.quotes[currency.toUpperCase()].market_cap
  if (!marketCap || marketCap <= 0) {
    throw new Error('invalid marketCap')
  }
  return marketCap
}

export const getMarketCaps = async (
  baseSymbols: string[],
  quote: string,
): Promise<Record<string, number>> => {
  const priceData = await getPriceData(quote)

  // There are duplicate symbols on the response. We only want the lowest in rank
  const sortedData = priceData.sort((a: any, b: any) => a.rank - b.rank)
  const priceMap = new Map()
  for (const price of sortedData) {
    const key = price.symbol.toUpperCase()
    if (!priceMap.get(key)) {
      priceMap.set(key, price)
    }
  }

  const entries = baseSymbols.map((symbol) => {
    const data = priceMap.get(symbol.toUpperCase())
    return [symbol, toMarketCap(data, quote)]
  })

  return Object.fromEntries(entries)
}
