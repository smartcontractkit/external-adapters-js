import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import { GetPriceIndex } from '../config'

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

const getPriceIndex: GetPriceIndex = async (index, currency) => {
  const symbols = index.map(({ symbol }) => symbol.toUpperCase()).join()
  const prices = await getPriceData(symbols, currency)

  return index.map((i) => {
    const data = prices[i.symbol.toUpperCase()]
    return { ...i, price: toAssetPrice(data, currency) }
  })
}

export default { getPriceIndex }
