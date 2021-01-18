import { Requester } from '@chainlink/external-adapter'

const getCoinList = async () => {
  const url = 'https://api.coingecko.com/api/v3/coins/list'
  const config = {
    url,
  }
  const response = await Requester.request(config)
  return response.data
}

const getPriceData = async (id: string, currency: string, marketcap = false) => {
  const url = 'https://api.coingecko.com/api/v3/simple/price'
  const params = {
    ids: id,
    vs_currencies: currency.toLowerCase(),
    include_market_cap: marketcap,
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

const toMarketCap = (data: Record<string, any>, coinId: string, currency: string) => {
  const resultKey = `${currency.toLowerCase()}_market_cap`
  const marketCap = data[coinId] && data[coinId][resultKey]
  if (!marketCap || marketCap <= 0) {
    throw new Error('invalid marketCap')
  }
  return marketCap
}

export const getPrices = async (
  baseSymbols: string[],
  quote: string,
): Promise<Record<string, number>> => {
  const coinList = await getCoinList()

  const entries = await Promise.all(
    baseSymbols.map(async (symbol) => {
      const coin = coinList.find(
        (d: any) =>
          d.symbol.toLowerCase() === symbol.toLowerCase() &&
          !coingeckoBlacklist.includes(d.id.toLowerCase()),
      )
      const data = await getPriceData(coin.id, quote)
      return [symbol, toAssetPrice(data, coin.id, quote)]
    }),
  )

  return Object.fromEntries(entries)
}

export const getMarketCaps = async (
  baseSymbols: string[],
  quote: string,
): Promise<Record<string, number>> => {
  const coinList = await getCoinList()

  const entries = await Promise.all(
    baseSymbols.map(async (symbol) => {
      const coin = coinList.find(
        (d: any) =>
          d.symbol.toLowerCase() === symbol.toLowerCase() &&
          !coingeckoBlacklist.includes(d.id.toLowerCase()),
      )
      const data = await getPriceData(coin.id, quote)
      return [symbol, toMarketCap(data, coin.id, quote)]
    }),
  )

  return Object.fromEntries(entries)
}
