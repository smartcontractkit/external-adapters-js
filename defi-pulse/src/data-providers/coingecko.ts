import { Requester } from '@chainlink/external-adapter'
import { Index } from '../adapter'

const getCoinList = async () => {
  const url = 'https://api.coingecko.com/api/v3/coins/list'
  const config = {
    url,
  }
  const response = await Requester.request(config)
  return response.data
}

const getPriceData = async (id: string) => {
  const url = 'https://api.coingecko.com/api/v3/simple/price'
  const params = {
    ids: id,
    vs_currencies: 'usd',
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

const toAssetPrice = (data: Record<string, any>, coinId: string) => {
  const price = data[coinId] && data[coinId].usd
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

const getPriceIndex = async (index: Index): Promise<Index> => {
  const coinList = await getCoinList()
  await Promise.all(
    index.map(async (i) => {
      const coin = coinList.find(
        (d: any) =>
          d.symbol.toLowerCase() === i.asset.toLowerCase() &&
          !coingeckoBlacklist.includes(d.id.toLowerCase()),
      )
      const data = await getPriceData(coin.id)
      i.price = toAssetPrice(data, coin.id)
    }),
  )
  return index
}

export default { getPriceIndex }
