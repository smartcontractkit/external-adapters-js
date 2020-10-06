const { Requester } = require('@chainlink/external-adapter')
const Decimal = require('decimal.js')

const getPriceData = async (synths) => {
  const url = 'https://min-api.cryptocompare.com/data/pricemulti'
  const params = {
    tsyms: 'USD',
    fsyms: synths
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
      const price = i.priceData.USD
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
  const synths = []
  data.index.forEach(synth => {
    synths.push(synth.symbol.toUpperCase())
  })
  const prices = await getPriceData(synths.join())
  for (const symbol in prices) {
    if (!Object.prototype.hasOwnProperty.call(prices, symbol)) continue
    for (let i = 0; i < data.index.length; i++) {
      if (symbol.toUpperCase() !== data.index[i].symbol.toUpperCase()) continue
      data.index[i].priceData = prices[symbol]
      break
    }
  }

  return data
}

module.exports.createRequest = createRequest
module.exports.calculateIndex = calculateIndex
