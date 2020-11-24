import { Requester } from '@chainlink/external-adapter'
import { Index } from '../adapter'
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

const toAssetPrice = (data: Record<string, any>) => {
  const price = data.quote && data.quote.USD.price
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

const getPriceIndex = async (index: Index): Promise<Index> => {
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
    const data = pricesMap.get(i.asset.toUpperCase())
    i.price = toAssetPrice(data)
  }

  return index
}

export default { getPriceIndex }
