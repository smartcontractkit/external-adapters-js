import { Requester } from '@chainlink/external-adapter'
import Decimal from 'decimal.js'
import { IndexAsset } from '../adapter'
import { util } from '@chainlink/ea-bootstrap'

const getPriceData = async (symbols: string) => {
  const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
  const headers = {
    'X-CMC_PRO_API_KEY': util.getRequiredEnv('API_KEY'),
  }
  const params = {
    symbol: symbols,
    convert: 'USD',
  }
  const config = {
    url,
    headers,
    params,
  }
  const response = await Requester.request(config)
  return response.data
}

const calculateIndex = (index: IndexAsset[]): number => {
  let value = new Decimal(0)
  index.forEach((i) => {
    const price = i.priceData && i.priceData.quote.USD.price
    if (price <= 0) {
      throw Error('invalid price')
    }
    value = value.plus(new Decimal(i.units).times(new Decimal(price)))
  })

  return value.toNumber()
}

const getPriceIndex = async (index: IndexAsset[]): Promise<IndexAsset[]> => {
  const symbols: string[] = []
  index.forEach(({ asset }) => {
    symbols.push(asset.toUpperCase())
  })
  const prices = await getPriceData(symbols.join())

  const pricesMap = new Map()
  for (const symbol in prices.data) {
    pricesMap.set(symbol.toUpperCase(), prices.data[symbol])
  }

  for (const i of index) {
    i.priceData = pricesMap.get(i.asset.toUpperCase())
  }

  return index
}

export default {
  calculateIndex,
  getPriceIndex,
}
