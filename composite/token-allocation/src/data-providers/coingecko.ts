import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

const getRequest = (): { baseURL: string; params: Record<string, any> } => {
  const apiKey = util.getEnv('API_KEY')
  if (!apiKey) {
    return {
      baseURL: 'https://api.coingecko.com/api/v3/',
      params: {},
    }
  }

  return {
    baseURL: 'https://pro-api.coingecko.com/api/v3',
    params: {
      x_cg_pro_api_key: apiKey,
    },
  }
}

const getCoinList = async () => {
  const url = '/coins/list'
  const config = {
    ...getRequest(),
    url,
  }
  const response = await Requester.request(config)
  return response.data
}

const getPriceData = async (ids: string, currency: string, marketcap = false) => {
  const url = '/simple/price'
  const { baseURL, params } = getRequest()
  const config = {
    baseURL,
    url,
    params: {
      ...params,
      ids,
      vs_currencies: currency.toLowerCase(),
      include_market_cap: marketcap,
    },
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
  'kyber-network-crystal', // TEMP blacklisted due to no volume
]

const toAssetPrice = (data: Record<string, any>, currency: string) => {
  const price = data && data[currency.toLowerCase()]
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

const toMarketCap = (data: Record<string, any>, currency: string) => {
  const resultKey = `${currency.toLowerCase()}_market_cap`
  const marketCap = data && data[resultKey]
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
  const idToSymbol = getIdtoSymbol(baseSymbols, coinList)
  const ids = Object.keys(idToSymbol).join(',')
  const response: Record<string, any> = await getPriceData(ids, quote)
  return Object.fromEntries(
    Object.entries(response).map(([coinId, data]) => [
      idToSymbol[coinId],
      toAssetPrice(data, quote),
    ]),
  )
}

export const getMarketCaps = async (
  baseSymbols: string[],
  quote: string,
): Promise<Record<string, number>> => {
  const coinList = await getCoinList()
  const idToSymbol = getIdtoSymbol(baseSymbols, coinList)
  const ids = Object.keys(idToSymbol).join(',')
  const response: Record<string, any> = await getPriceData(ids, quote, true)
  return Object.fromEntries(
    Object.entries(response).map(([coinId, data]) => [
      idToSymbol[coinId],
      toMarketCap(data, quote),
    ]),
  )
}

const getIdtoSymbol = (symbols: string[], coinList: any) => {
  const idToSymbol: Record<string, string> = {
    // Pre-set IDs here
    'kyber-network': 'KNC',
  }
  symbols.forEach((symbol) => {
    const coin = coinList.find(
      (d: any) =>
        d.symbol.toLowerCase() === symbol.toLowerCase() &&
        !coingeckoBlacklist.includes(d.id.toLowerCase()),
    )
    if (coin && coin.id) {
      idToSymbol[coin.id] = symbol
    }
  })
  return idToSymbol
}
