const { Requester } = require('@chainlink/external-adapter')
const Decimal = require('decimal.js')

const getPriceData = async (synth) => {
  const url = 'https://api.coinpaprika.com/v1/tickers'
  const params = {
    quotes: 'USD'
  }
  const config = {
    url,
    params
  }
  const response = await Requester.request(config)
  return response.data
}

const calculateIndex = (indexes) => {
  let value = new Decimal(0)
  try {
    indexes.forEach(i => {
      const price = i.priceData.quotes.USD.price
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
  const priceDatas = await getPriceData()
  await Promise.all(data.index.map(async (synth) => {
    synth.priceData = priceDatas.sort((a, b) => (a.rank > b.rank) ? 1 : -1)
      .find(d => d.symbol.toLowerCase() === synth.symbol.toLowerCase())
  }))
  return data
}

module.exports.createRequest = createRequest
module.exports.calculateIndex = calculateIndex
