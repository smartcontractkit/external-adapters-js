const { Requester } = require('@chainlink/external-adapter')
const Decimal = require('decimal.js')

const getPriceData = async (synth) => {
  const url = `https://web3api.io/api/v2/market/prices/${synth.toLowerCase()}/latest`
  const headers = {
    'X-API-KEY': process.env.API_KEY
  }
  const config = {
    url,
    headers
  }
  return await Requester.request(config)
}

const calculateIndex = (indexes) => {
  let value = new Decimal(0)
  try {
    indexes.forEach(i => {
      value = value.plus(new Decimal(i.units).times(new Decimal(i.priceData.payload[`${i.symbol.toLowerCase()}_usd`].price)))
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
