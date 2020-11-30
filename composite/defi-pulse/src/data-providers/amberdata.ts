import { Requester } from '@chainlink/external-adapter'
import { Index } from '../adapter'
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

const getPriceIndex = async (index: Index, currency: string): Promise<Index> => {
  return await Promise.all(
    index.map(async (i) => {
      const data = await getPriceData(i.asset)
      const symbolData = data.payload.find(
        (asset: Record<string, any>) => asset.symbol.toUpperCase() === i.asset.toUpperCase(),
      )
      return { ...i, price: toAssetPrice(symbolData) }
    }),
  )
}

export default { getPriceIndex }
