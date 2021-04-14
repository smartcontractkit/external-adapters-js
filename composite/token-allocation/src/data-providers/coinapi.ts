import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

const getPriceData = async (symbol: string, currency: string) => {
  const url = `https://rest.coinapi.io/v1/exchangerate/${symbol}/${currency.toUpperCase()}`
  const config = {
    url,
    params: {
      apikey: util.getRandomRequiredEnv('API_KEY'),
    },
  }
  const response = await Requester.request(config)
  return response.data
}

const toAssetPrice = (data: Record<string, any>) => {
  const price = data.rate
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

export const getPrices = async (
  baseSymbols: string[],
  quote: string,
): Promise<Record<string, number>> => {
  const entries = await Promise.all(
    baseSymbols.map(async (symbol) => {
      const data = await getPriceData(symbol, quote)
      return [symbol, toAssetPrice(data)]
    }),
  )

  return Object.fromEntries(entries)
}
export const getMarketCaps = () => {
  throw Error('not implemented')
}
