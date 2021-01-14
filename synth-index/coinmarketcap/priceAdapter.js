const { Requester } = require('@chainlink/external-adapter')
const Decimal = require('decimal.js')
const { util } = require('@chainlink/ea-bootstrap')

// Defaults we use when there are multiple currencies with the same symbol
const presetSlugs = {
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

const getPriceData = async (assets, convert) => {
  const _getPriceData = async (params) => {
    const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
    const headers = {
      'X-CMC_PRO_API_KEY': util.getRandomRequiredEnv('API_KEY'),
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

const calculateIndex = (indexes) => {
  let value = new Decimal(0)
  try {
    indexes.forEach((i) => {
      const price = i.priceData.quote.USD.price
      if (price <= 0) {
        throw Error('invalid price')
      }
      value = value.plus(new Decimal(i.units).times(new Decimal(price)))
    })
  } catch (error) {
    throw error.message
  }
  return value.toNumber()
}

const execute = async (jobRunID, data) => {
  const assets = data.index.map(({ asset }) => asset.toUpperCase())
  const pricesData = await getPriceData(assets, 'USD')

  for (let i = 0; i < data.index.length; i++) {
    const { asset } = data.index[i]
    const _iEqual = (s1, s2) => s1.toUpperCase() === s2.toUpperCase()
    data.index[i].priceData = Object.values(pricesData).find((o) => _iEqual(o.symbol, asset))
  }

  return data
}

module.exports.execute = execute
module.exports.calculateIndex = calculateIndex
