const { Requester } = require('@chainlink/external-adapter')
const Decimal = require('decimal.js')

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
}

const getPriceData = async (synths) => {
  const _getPriceData = async (params) => {
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

  // We map some symbols as slugs
  const slugs = synths.map((s) => presetSlugs[s]).filter(Boolean)
  const symbols = synths.filter((s) => !presetSlugs[s])

  let data = {}

  // We need to make two separate requests, one querying slugs
  if (slugs) {
    const slugPrices = _getPriceData({ slug: slugs.join(), convert: 'USD' })
    data = { ...data, ...slugPrices.data }
  }

  // The other one querying symbols
  if (symbols) {
    const symbolsPrices = _getPriceData({ symbol: symbols.join(), convert: 'USD' })
    data = { ...data, ...symbolsPrices.data }
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
  const synths = []
  data.index.forEach((synth) => {
    synths.push(synth.asset.toUpperCase())
  })

  const pricesData = await getPriceData(synths)
  for (let i = 0; i < data.index.length; i++) {
    const { asset } = data.index[i]
    const _iEqual = (s1, s2) => s1.toUpperCase() === s2.toUpperCase()
    data.index[i].priceData = Object.values(pricesData).find((o) => _iEqual(o.symbol, asset))
  }

  return data
}

module.exports.execute = execute
module.exports.calculateIndex = calculateIndex
