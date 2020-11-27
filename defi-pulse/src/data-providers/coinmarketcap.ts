import { Requester } from '@chainlink/external-adapter'
import { Index } from '../adapter'
import { util } from '@chainlink/ea-bootstrap'

const getPriceData = async (symbols: string, currency: string) => {
  const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
  const headers = {
    'X-CMC_PRO_API_KEY': util.getRequiredEnv('API_KEY'),
  }
  const params = {
    symbol: symbols,
    convert: currency.toUpperCase(),
  }
  const config = {
    url,
    headers,
    params,
  }
  const response = await Requester.request(config)
  return response.data
}

const toAssetPrice = (data: Record<string, any>, currency: string) => {
  const price = data.quote && data.quote[currency.toUpperCase()].price
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

const getPriceIndex = async (index: Index, currency: string): Promise<Index> => {
  const symbols = index.map(({ asset }) => asset.toUpperCase()).join()
  const prices = await getPriceData(symbols, currency)

  return index.map((i) => {
    const data = prices.data[i.asset]
    return { ...i, price: toAssetPrice(data, currency) }
  })
}

export default { getPriceIndex }
