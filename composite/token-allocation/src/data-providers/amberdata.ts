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

const toAssetPrice = (data: Record<string, any>) => {
  const price = data && data.priceUSD
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
      const data = await getPriceData(symbol)
      const symbolData = data.payload.find(
        (asset: Record<string, any>) => asset.symbol.toUpperCase() === symbol.toUpperCase(),
      )
      return [symbol, toAssetPrice(symbolData)]
    }),
  )

  return Object.fromEntries(entries)
}
