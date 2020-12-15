const { Requester } = require('@chainlink/external-adapter')
const Decimal = require('decimal.js')
const { util } = require('@chainlink/ea-bootstrap')

const getPriceData = async (synth) => {
  const url = `https://rest.coinapi.io/v1/exchangerate/${synth}/USD`
  const config = {
    url,
    params: {
      apikey: util.pickRandomFromString(process.env.API_KEY, ','),
    },
  }
  const response = await Requester.request(config)
  return response.data
}

const calculateIndex = (indexes) => {
  let value = new Decimal(0)
  try {
    indexes.forEach((i) => {
      const price = i.priceData.rate
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
  await Promise.all(
    data.index.map(async (synth) => {
      synth.priceData = await getPriceData(synth.asset)
    }),
  )
  return data
}

module.exports.execute = execute
module.exports.calculateIndex = calculateIndex
