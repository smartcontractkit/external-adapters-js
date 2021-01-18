import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import { GetPriceIndex } from '../config'

const getPriceData = async (symbol: string, currency: string) => {
  const url = `https://us.market-api.kaiko.io/v2/data/trades.v1/spot_exchange_rate/${symbol.toLowerCase()}/${currency.toLowerCase()}`
  const params = {
    sort: 'desc',
    interval: '1m',
  }
  const headers = {
    'X-Api-Key': util.getRequiredEnv('API_KEY'),
    'User-Agent': 'Chainlink',
  }
  const timeout = 5000
  const config = {
    url,
    params,
    headers,
    timeout,
  }
  const response = await Requester.request(config)
  return response.data
}

const toAssetPrice = (data: Record<string, any>) => {
  const price = data[0] && data[0].price
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

const getPriceIndex: GetPriceIndex = async (index, currency) => {
  return await Promise.all(
    index.map(async (i) => {
      // Particular for the Kaiko API only
      const asset = i.symbol === 'UNI' ? 'uniswap' : i.symbol
      const data = await getPriceData(asset, currency)
      const notNullPrices = data.data.filter((x: any) => x.price !== null)
      return { ...i, price: toAssetPrice(notNullPrices) }
    }),
  )
}

const getMarketcap = () => {
  throw 'not implemented'
}

export default { getPriceIndex, getMarketcap }
