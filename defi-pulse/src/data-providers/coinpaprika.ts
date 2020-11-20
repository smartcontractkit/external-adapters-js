import { Requester } from '@chainlink/external-adapter'
import Decimal from 'decimal.js'
import { IndexAsset } from '../adapter'

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

const calculateIndex = (index: IndexAsset[]): number => {
  let value = new Decimal(0)

  for (const i of index) {
    const price = i.priceData && i.priceData.quotes.USD.price
    if (!price || price <= 0) {
      throw Error('Invalid price')
    }
    value = value.plus(new Decimal(i.units).times(new Decimal(price)))
  }

  return value.toNumber()
}

const getPriceIndex = async (index: IndexAsset[]): Promise<IndexAsset[]> => {
  const priceDatas = await getPriceData()
  await Promise.all(
    index.map(async (i) => {
      i.priceData = priceDatas
        .sort((a: any, b: any) => (a.rank > b.rank ? 1 : -1))
        .find((d: any) => d.symbol.toLowerCase() === i.asset.toLowerCase())
    }),
  )
  return index
}

export default {
  calculateIndex,
  getPriceIndex,
}
