import { Requester } from '@chainlink/external-adapter'
import { GetPriceIndex } from '../config'

const getCoinList = async () => {
  const url = 'https://api.coingecko.com/api/v3/coins/list'
  const config = {
    url,
  }
  const response = await Requester.request(config)
  return response.data
}

const getPriceData = async (id: string, currency: string) => {
  const url = 'https://api.coingecko.com/api/v3/simple/price'
  const params = {
    ids: id,
    vs_currencies: currency.toLowerCase(),
  }
  const config = {
    url,
    params,
  }
  const response = await Requester.request(config)
  return response.data
}

const coingeckoBlacklist = [
  'leocoin',
  'farmatrust',
  'freetip',
  'compound-coin',
  'uni-coin',
  'unicorn-token',
]

const toAssetPrice = (data: Record<string, any>, coinId: string, currency: string) => {
  const price = data[coinId] && data[coinId][currency.toLowerCase()]
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

const getPriceIndex: GetPriceIndex = async (index, currency) => {
  const coinList = await getCoinList()
  return await Promise.all(
    index.map(async (i) => {
      const coin = coinList.find(
        (d: any) =>
          d.symbol.toLowerCase() === i.symbol.toLowerCase() &&
          !coingeckoBlacklist.includes(d.id.toLowerCase()),
      )
      const data = await getPriceData(coin.id, currency)
      return { ...i, price: toAssetPrice(data, coin.id, currency) }
    }),
  )
}

export default { getPriceIndex }
