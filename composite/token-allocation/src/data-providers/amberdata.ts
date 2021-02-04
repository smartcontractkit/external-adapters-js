import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

const getPriceData = async (symbol: string) => {
  const url = `https://web3api.io/api/v2/market/tokens/prices/${symbol.toLowerCase()}/latest`
  const headers = {
    'X-API-KEY': util.getRequiredEnv('API_KEY'),
  }
  const config = {
    url,
    headers,
  }
  const response = await Requester.request(config)
  return response.data
}

const toAssetPrice = (data: Record<string, any>, currency: string) => {
  const resultKey = `price${currency.toUpperCase()}`
  const price = data && data[resultKey]
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

const toMarketCap = (data: Record<string, any>, currency: string) => {
  const resultKey = `marketCap${currency.toUpperCase()}`
  const marketCap = data && data[resultKey]
  if (!marketCap || marketCap <= 0) {
    throw new Error('invalid marketCap')
  }
  return marketCap
}

export const getPrices = async (
  baseSymbols: string[],
  quote: string,
): Promise<Record<string, number>> => {
  const entries = await Promise.all(
    baseSymbols.map(async (symbol) => {
      const data = await getPriceData(symbol)
      const symbolData = data.payload.find(
        (asset: Record<string, any>) => asset.symbol.toUpperCase() === symbol.toUpperCase(),
      )
      return [symbol, toAssetPrice(symbolData, quote)]
    }),
  )

  return { ...Object.fromEntries(entries), cost: baseSymbols.length }
}

export const getMarketCaps = async (
  baseSymbols: string[],
  quote: string,
): Promise<Record<string, number>> => {
  const entries = await Promise.all(
    baseSymbols.map(async (symbol) => {
      const data = await getPriceData(symbol)
      const symbolData = data.payload.find(
        (asset: Record<string, any>) => asset.symbol.toUpperCase() === symbol.toUpperCase(),
      )
      return [symbol, toMarketCap(symbolData, quote)]
    }),
  )

  return Object.fromEntries(entries)
}
