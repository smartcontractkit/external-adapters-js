import { Requester } from '@chainlink/external-adapter'
import { Index } from '../adapter'

// Defaults we use when there are multiple currencies with the same symbol
const presetSlugs: Record<string, string> = {
  COMP: 'compound',
  BNT: 'bancor',
  RCN: 'ripio-credit-network',
  UNI: 'uniswap',
  CRV: 'curve-dao-token',
  FNX: 'finnexus',
  ETC: 'ethereum-classic',
  BAT: 'basic-attention-token',
  CRO: 'crypto-com-coin',
  LEO: 'unus-sed-leo',
  FTT: 'ftx-token',
  HT: 'huobi-token',
  OKB: 'okb',
  KCS: 'kucoin-shares',
}

const getPriceData = async (assets: string[], convert: string) => {
  const _getPriceData = async (params: any): Promise<any> => {
    const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
    const headers = {
      'X-CMC_PRO_API_KEY': process.env.API_KEY,
    }
    const config = {
      url,
      headers,
      params,
    }
    const response = await Requester.request(config)
    return response.data
  }

  let data = {}
  if (!assets || assets.length === 0) return data

  // We map some symbols as slugs
  const slugs = assets.map((s) => presetSlugs[s]).filter(Boolean)
  const symbols = assets.filter((s) => !presetSlugs[s])

  // We need to make two separate requests, one querying slugs
  if (slugs.length > 0) {
    const slugPrices = await _getPriceData({ slug: slugs.join(), convert })
    data = { ...data, ...slugPrices.data }
  }

  // The other one querying symbols
  if (symbols.length > 0) {
    const symbolPrices = await _getPriceData({ symbol: symbols.join(), convert })
    data = { ...data, ...symbolPrices.data }
  }

  return data
}

const toAssetPrice = (data: Record<string, any>, currency: string) => {
  const price = data.quote && data.quote[currency].price
  if (!price || price <= 0) {
    throw new Error('invalid price')
  }
  return price
}

const getPriceIndex = async (index: Index, currency: string): Promise<Index> => {
  currency = currency.toUpperCase()

  const assets = index.map(({ asset }) => asset.toUpperCase())
  const pricesData = await getPriceData(assets, currency)

  return index.map((i) => {
    const _iEqual = (s1: string, s2: string) => s1.toUpperCase() === s2.toUpperCase()
    const data: any = Object.values(pricesData).find((o: any) => _iEqual(o.symbol, i.asset))
    return { ...i, price: toAssetPrice(data, currency) }
  })
}

export default { getPriceIndex }
