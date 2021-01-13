import { Requester } from '@chainlink/external-adapter'
import { Index } from '../adapter'
import { util } from '@chainlink/ea-bootstrap'

const getPriceData = async (symbols: string, slugs: string, currency: string) => {
  const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
  const headers = {
    'X-CMC_PRO_API_KEY': util.getRequiredEnv('API_KEY'),
  }
  const params = {
    convert: currency.toUpperCase(),
    ...(symbols && { symbol: symbols }),
    ...(slugs && { slug: slugs }),
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

// Defaults we use when there are multiple currencies with the same symbol
const presetSlugs: Record<string, string> = {
  COMP: 'compound',
  UNI: 'uniswap',
}

const getPriceIndex = async (index: Index, currency: string): Promise<Index> => {
  // CMC does not allow to query by symbol and slug at the same time
  const slugsIndex: Index = index.filter(({ asset }) => presetSlugs[asset])
  const slugs = slugsIndex.map(({ asset }) => presetSlugs[asset.toUpperCase()]).join()
  const slugPrices = slugsIndex.length > 0 ? await getPriceData('', slugs, currency) : []

  const filteredIndex: Index = index.filter(({ asset }) => !presetSlugs[asset])
  const symbols = filteredIndex.map(({ asset }) => asset.toUpperCase()).join()
  const symbolPrices = await getPriceData(symbols, '', currency)

  const prices = { ...slugPrices.data, ...symbolPrices.data }

  const indexMap = new Map()
  for (const id in prices) {
    indexMap.set(prices[id].symbol, prices[id])
  }
  return index.map((i) => {
    const data = indexMap.get(i.asset)
    return { ...i, price: toAssetPrice(data, currency) }
  })
}

export default { getPriceIndex }
