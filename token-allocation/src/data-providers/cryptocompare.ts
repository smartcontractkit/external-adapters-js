import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import { GetPriceIndex } from '../config'

const getPriceData = async (symbols: string, currency: string) => {
  const url = 'https://min-api.cryptocompare.com/data/pricemultifull'
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
  const price = data[currency.toUpperCase()].PRICE
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

const toMarketcap = (data: Record<string, any>, currency: string) => {
  const marketcap = data[currency.toUpperCase()].MKTCAP
  if (!marketcap || marketcap <= 0) {
    throw new Error('Invalid marketcap')
  }
  return marketcap
}

const getMarketcap: GetPriceIndex = async (index, currency) => {
  const symbols = index.map(({ symbol }) => symbol.toUpperCase()).join()
  const prices = await getPriceData(symbols, currency)

  return index.map((i) => {
    const data = prices.RAW[i.symbol.toUpperCase()]
    return { ...i, marketcap: toMarketcap(data, currency) }
  })
}

export default { getPriceIndex, getMarketcap }
