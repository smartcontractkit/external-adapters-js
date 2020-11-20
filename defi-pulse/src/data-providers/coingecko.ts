import { Requester } from '@chainlink/external-adapter'
import Decimal from 'decimal.js'
import { IndexAsset } from '../adapter'

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

const calculateIndex = (index: IndexAsset[]): number => {
  let value = new Decimal(0)
  index.forEach((i) => {
    const price = i.priceData && i.coinId && i.priceData[i.coinId].usd
    if (price <= 0) {
      throw Error('invalid price')
    }
    value = value.plus(new Decimal(i.units).times(new Decimal(price)))
  })
  return value.toNumber()
}

const coingeckoBlacklist = [
  'leocoin',
  'farmatrust',
  'freetip',
  'compound-coin',
  'uni-coin',
  'unicorn-token',
]

const getPriceIndex = async (index: IndexAsset[]): Promise<IndexAsset[]> => {
  const coinList = await getCoinList()
  await Promise.all(
    index.map(async (synth) => {
      const coin = coinList.find(
        (d: any) =>
          d.symbol.toLowerCase() === synth.asset.toLowerCase() &&
          !coingeckoBlacklist.includes(d.id.toLowerCase()),
      )
      synth.coinId = coin.id
      synth.priceData = await getPriceData(coin.id)
    }),
  )
  return index
}

export default {
  calculateIndex,
  getPriceIndex,
}
