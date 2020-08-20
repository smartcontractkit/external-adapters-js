const { Requester } = require('@chainlink/external-adapter')
const Decimal = require('decimal.js')

const nomicsIds = {
  LEO: 'LEOTOKEN',
  FTT: 'FTXTOKEN',
}

const getPriceData = async (synths) => {
  const url = 'https://api.nomics.com/v1/currencies/ticker'
  const params = {
    ids: synths,
    convert: 'USD',
    key: process.env.API_KEY,
  }
  const config = {
    url,
    params,
  }
  const response = await Requester.request(config)
  return response.data
}

const calculateIndex = (indexes) => {
  let value = new Decimal(0)
  try {
    indexes.forEach((i) => {
      const price = i.priceData.price
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
    let symbol = synth.symbol.toUpperCase()
    if (symbol in nomicsIds) {
      symbol = nomicsIds[symbol]
    }
    synths.push(symbol)
  })
  const prices = await getPriceData(synths.join())
  prices.forEach((price) => {
    for (let i = 0; i < data.index.length; i++) {
      if (data.index[i].symbol.toUpperCase() !== price.symbol) {
        continue
      }
      data.index[i].priceData = price
      break
    }
  })

  return data
}

module.exports.execute = execute
module.exports.calculateIndex = calculateIndex
