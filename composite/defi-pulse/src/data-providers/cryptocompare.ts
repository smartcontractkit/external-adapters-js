import { Requester } from '@chainlink/external-adapter'
import { Index } from '../adapter'
import { util } from '@chainlink/ea-bootstrap'

const getPriceData = async (symbols: string, currency: string) => {
  const url = 'https://min-api.cryptocompare.com/data/pricemulti'
  const params = {
    tsyms: currency.toUpperCase(),
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

const toAssetPrice = (data: Record<string, any>, currency: string) => {
  const price = data[currency.toUpperCase()]
  if (!price || price <= 0) {
    throw new Error('Invalid price')
  }
  return price
}

const getPriceIndex = async (index: Index, currency: string): Promise<Index> => {
  const symbols = index.map(({ asset }) => asset.toUpperCase()).join()
  const prices = await getPriceData(symbols, currency)

  return index.map((i) => {
    const data = prices[i.asset.toUpperCase()]
    return { ...i, price: toAssetPrice(data, currency) }
  })
}

export default { getPriceIndex }
