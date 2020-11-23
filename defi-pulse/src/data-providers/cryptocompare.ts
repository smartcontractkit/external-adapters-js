import { Requester } from '@chainlink/external-adapter'
import { Index } from '../adapter'
import { util } from '@chainlink/ea-bootstrap'

const getPriceData = async (symbols: string) => {
  const url = 'https://min-api.cryptocompare.com/data/pricemulti'
  const params = {
    tsyms: 'USD',
    fsyms: symbols,
    api_key: util.getRequiredEnv('API_KEY'),
  }
  const config = {
    url,
    params,
  }
  const response = await Requester.request(config)
  return response.data
}

const toAssetPrice = (data: Record<string, any>) => {
  const price = data['USD']
  if (!price || price <= 0) {
    throw new Error('Invalid price')
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
  for (const symbol in prices) {
    pricesMap.set(symbol.toUpperCase(), prices[symbol])
  }

  for (const i of index) {
    const data = pricesMap.get(i.asset.toUpperCase())
    i.priceData = data
    i.price = toAssetPrice(data)
  }

  return index
}

export default { getPriceIndex }
