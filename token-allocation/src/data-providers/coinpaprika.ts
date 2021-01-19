import { Requester } from '@chainlink/external-adapter'
import { GetPriceIndex } from '../config'

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

const getPriceIndex: GetPriceIndex = async (index, currency) => {
  const priceData = await getPriceData(currency)

  // There are duplicate symbols on the response. We only want the lowest in rank
  const sortedData = priceData.sort((a: any, b: any) => a.rank - b.rank)
  const priceMap = new Map()
  for (const price of sortedData) {
    const key = price.symbol.toUpperCase()
    if (!priceMap.get(key)) {
      priceMap.set(key, price)
    }
  }

  return index.map((i) => {
    const data = priceMap.get(i.symbol.toUpperCase())
    return { ...i, price: toAssetPrice(data, currency) }
  })
}

export default { getPriceIndex }
