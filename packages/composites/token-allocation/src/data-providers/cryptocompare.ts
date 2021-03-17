import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

const getPriceData = async (symbols: string, currency: string) => {
  const url = 'https://min-api.cryptocompare.com/data/pricemultifull'
  const params = {
    tsyms: currency.toUpperCase(),
    fsyms: symbols,
    api_key: util.getRequiredEnv('API_KEY'),
  }
  const config = {
    url,
    params,
  }
  const response = await Requester.request(config)
  return response.data
}

const toAssetPrice = (data: Record<string, any>, currency: string) => {
  const price = data[currency.toUpperCase()].PRICE
  if (!price || price <= 0) {
    throw new Error('Invalid price')
  }
  return price
}

export const getPrices = async (
  baseSymbols: string[],
  quote: string,
): Promise<Record<string, number>> => {
  const symbols = baseSymbols.map((symbol) => symbol.toUpperCase()).join()
  const prices = await getPriceData(symbols, quote)

  const entries = baseSymbols.map((symbol) => {
    const data = prices.RAW[symbol.toUpperCase()]
    return [symbol, toAssetPrice(data, quote)]
  })

  return Object.fromEntries(entries)
}

const toMarketCap = (data: Record<string, any>, currency: string) => {
  const marketCap = data[currency.toUpperCase()].MKTCAP
  if (!marketCap || marketCap <= 0) {
    throw new Error('Invalid marketCap')
  }
  return marketCap
}

export const getMarketCaps = async (
  baseSymbols: string[],
  quote: string,
): Promise<Record<string, number>> => {
  const symbols = baseSymbols.map((symbol) => symbol.toUpperCase()).join()
  const prices = await getPriceData(symbols, quote)

  const entries = baseSymbols.map((symbol) => {
    const data = prices.RAW[symbol.toUpperCase()]
    return [symbol, toMarketCap(data, quote)]
  })

  return Object.fromEntries(entries)
}
