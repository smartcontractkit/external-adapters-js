import { Requester } from '@chainlink/external-adapter'
import { Index } from '../adapter'

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

const toAssetPrice = (data: Record<string, any>, currency: string) => {
  const price = data.quotes && data.quotes[currency.toUpperCase()].price
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

const getPriceIndex = async (index: Index, currency: string): Promise<Index> => {
  const priceData = await getPriceData(currency)

  const sortedData = priceData.sort((a: any, b: any) => a.rank - b.rank)
  const priceMap = new Map()
  for (const price of sortedData) {
    const key = price.symbol.toUpperCase()
    if (!priceMap.get(key)) {
      priceMap.set(key, price)
    }
  }

  return index.map((i) => {
    const data = priceMap.get(i.asset.toUpperCase())
    return { ...i, price: toAssetPrice(data, currency) }
  })
}

export default { getPriceIndex }
