const { Requester } = require('@chainlink/external-adapter')
const Decimal = require('decimal.js')
const { util } = require('@chainlink/ea-bootstrap')

const getPriceData = async (synth) => {
  const url = `https://web3api.io/api/v2/market/prices/${synth.toLowerCase()}/latest`
  const headers = {
    'X-API-KEY': util.pickRandomFromString(process.env.API_KEY, ','),
  }
  const config = {
    url,
    headers,
  }
  const response = await Requester.request(config)
  return response.data
}

const calculateIndex = (indexes) => {
  let value = new Decimal(0)
  try {
    indexes.forEach((i) => {
      value = value.plus(
        new Decimal(i.units).times(
          new Decimal(i.priceData.payload[`${i.asset.toLowerCase()}_usd`].price),
        ),
      )
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
