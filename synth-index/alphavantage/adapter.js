const { Requester } = require('@chainlink/external-adapter')
const Decimal = require('decimal.js')

const getPriceData = async (synth) => {
  const url = 'https://www.alphavantage.co/query'
  const params = {
    function: 'CURRENCY_EXCHANGE_RATE',
    from_currency: synth,
    to_currency: 'USD',
    apikey: process.env.API_KEY
  }
  const config = {
    url,
    params
  }
  return await Requester.request(config)
}

const calculateIndex = (indexes) => {
  let value = new Decimal(0)
  try {
    indexes.forEach(i => {
      value = value.plus(new Decimal(i.units).times(new Decimal(i.priceData['Realtime Currency Exchange Rate']['5. Exchange Rate'])))
    })
  } catch (error) {
    throw error.message
  }
  return value.toNumber()
}

const createRequest = async (jobRunID, data) => {
  await Promise.all(data.index.map(async (synth) => {
    synth.priceData = await getPriceData(synth.symbol)
  }))
  return data
}

module.exports.createRequest = createRequest
module.exports.calculateIndex = calculateIndex
