const { Requester } = require('@chainlink/external-adapter')
const Decimal = require('decimal.js')

const getPriceData = async (synth) => {
  const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
  const headers = {
    'X-CMC_PRO_API_KEY': process.env.API_KEY
  }
  const params = {
    symbol: synth.symbol
  }
  const config = {
    url,
    headers,
    params
  }
  const response = await Requester.request(config)
  return response.data
}

const calculateIndex = (indexes) => {
  let value = new Decimal(0)
  try {
    indexes.forEach(i => {
      const price = i.priceData.data[i.symbol].quote.USD.price
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

const createRequest = async (jobRunID, data) => {
  await Promise.all(data.index.map(async (synth) => {
    synth.priceData = await getPriceData(synth)
  }))
  return data
}

module.exports.createRequest = createRequest
module.exports.calculateIndex = calculateIndex
