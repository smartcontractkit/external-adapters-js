import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import { GetPriceIndex } from '../config'

const getPriceData = async (symbol: string, currency: string) => {
  const url = `https://rest.coinapi.io/v1/exchangerate/${symbol}/${currency.toUpperCase()}`
  const config = {
    url,
    params: {
      apikey: util.getRequiredEnv('API_KEY'),
    },
  }
  const response = await Requester.request(config)
  return response.data
}

const toAssetPrice = (data: Record<string, any>) => {
  const price = data.rate
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

const getPriceIndex: GetPriceIndex = async (index, currency) => {
  return await Promise.all(
    index.map(async (i) => {
      const data = await getPriceData(i.symbol, currency)
      return { ...i, price: toAssetPrice(data) }
    }),
  )
}

const getMarketcap = () => {
  throw 'not implemented'
}

export default { getPriceIndex, getMarketcap }
