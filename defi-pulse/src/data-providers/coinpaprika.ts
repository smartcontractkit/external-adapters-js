import { Requester } from '@chainlink/external-adapter'
import { Index } from '../adapter'

const getPriceData = async () => {
  const url = 'https://api.coinpaprika.com/v1/tickers'
  const params = {
    quotes: 'USD',
  }
  const config = {
    url,
    params,
  }
  const response = await Requester.request(config)
  return response.data
}

const toAssetPrice = (data: Record<string, any>) => {
  const price = data.quotes && data.quotes.USD.price
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

const getPriceIndex = async (index: Index): Promise<Index> => {
  const priceDatas = await getPriceData()

  const sortedData = priceDatas.sort((a: any, b: any) => a.rank - b.rank)
  const priceMap = new Map()
  for (const price of sortedData) {
    const key = price.symbol.toUpperCase()
    if (!priceMap.get(key)) {
      priceMap.set(key, price)
    }
  }

  for (const i of index) {
    const data = priceMap.get(i.asset.toUpperCase())
    i.priceData = data
    i.price = toAssetPrice(data)
  }

  return index
}

export default { getPriceIndex }
