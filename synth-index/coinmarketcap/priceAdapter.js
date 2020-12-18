const { Requester } = require('@chainlink/external-adapter')
const Decimal = require('decimal.js')
const { util } = require('@chainlink/ea-bootstrap')

const getPriceData = async (synths) => {
  const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
  const headers = {
    'X-CMC_PRO_API_KEY': util.getRandomRequiredEnv('API_KEY'),
  }
  const params = {
    symbol: synths,
    convert: 'USD',
  }
  const config = {
    url,
    headers,
    params,
  }
  const response = await Requester.request(config)
  return response.data
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
  const prices = await getPriceData(synths.join())
  for (const symbol in prices.data) {
    if (!Object.prototype.hasOwnProperty.call(prices.data, symbol)) continue
    for (let i = 0; i < data.index.length; i++) {
      if (symbol.toUpperCase() !== data.index[i].asset.toUpperCase()) continue
      data.index[i].priceData = prices.data[symbol]
      break
    }
  }

  return data
}

module.exports.execute = execute
module.exports.calculateIndex = calculateIndex
