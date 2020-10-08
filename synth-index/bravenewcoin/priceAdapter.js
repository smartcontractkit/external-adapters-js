const { Requester } = require('@chainlink/external-adapter')
const Decimal = require('decimal.js')

const host = 'bravenewcoin-v1.p.rapidapi.com'
const url = `https://${host}/convert`

const getPriceData = async (synth) => {
  const headers = {
    'x-rapidapi-host': host,
    'x-rapidapi-key': process.env.API_KEY,
  }
  const params = {
    qty: 1,
    to: 'USD',
    from: synth.symbol,
  }
  const config = {
    url,
    params,
    headers,
  }
  const response = await Requester.request(config)
  return response.data
}

const calculateIndex = (indexes) => {
  let value = new Decimal(0)
  try {
    indexes.forEach((i) => {
      const price = i.priceData.to_quantity
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
      synth.priceData = await getPriceData(synth)
    }),
  )
  return data
}

module.exports.execute = execute
module.exports.calculateIndex = calculateIndex
