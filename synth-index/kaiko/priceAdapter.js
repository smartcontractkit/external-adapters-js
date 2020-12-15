const { Requester } = require('@chainlink/external-adapter')
const Decimal = require('decimal.js')
const { util } = require('@chainlink/ea-bootstrap')

const getPriceData = async (synth) => {
  const url = `https://us.market-api.kaiko.io/v2/data/trades.v1/spot_exchange_rate/${synth.asset.toLowerCase()}/usd`
  const params = {
    sort: 'desc',
  }
  const headers = {
    'X-Api-Key': util.pickRandomFromString(process.env.API_KEY, ","),
    'User-Agent': 'Chainlink',
  }
  const timeout = 5000
  const config = {
    url,
    params,
    headers,
    timeout,
  }
  const response = await Requester.request(config)
  return response.data
}

const calculateIndex = (indexes) => {
  let value = new Decimal(0)
  try {
    indexes.forEach((i) => {
      const price = i.priceData.data[0].price
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
