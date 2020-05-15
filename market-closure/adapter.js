const { Requester, Validator } = require('@chainlink/external-adapter')
const { MarketClosure } = require('market-closure')
const { tradingHalted } = require('./marketCheck')
const { getContractPrice } = require('../helpers/eth/readReferenceContract')
const adapterCreateRequest = require('./priceAdapter').createRequest

const customParams = {
  base: ['base', 'asset', 'from'],
  contract: ['referenceContract'],
  multiply: false,
  schedule: false
}

const createRequest = (input, callback) => {
  marketStatusRequest(input, adapterCreateRequest, callback)
}

const marketStatusRequest = (input, adapter, callback) => {
  const validator = new Validator(callback, input, customParams)
  const symbol = validator.validated.data.base.toUpperCase()
  const schedule = validator.validated.data.schedule || {}

  tradingHalted(symbol).then(halted => {
    handleRequest(input, validator, adapter, halted, callback)
  }).catch(() => {
    let halted = false
    if ('timezone' in schedule) {
      const marketSchedule = new MarketClosure(schedule)
      halted = marketSchedule.tradingHalted()
    }
    handleRequest(input, validator, adapter, halted, callback)
  })
}

const handleRequest = (input, validator, adapter, halted, callback) => {
  const jobRunID = validator.validated.id
  const contract = validator.validated.data.contract
  const multiply = validator.validated.data.multiply || 100000000

  if (!halted) {
    return adapter(input, callback)
  }

  getContractPrice(contract).then(price => {
    price = price / multiply
    if (price <= 0) {
      return adapter(input, callback)
    }

    const data = {
      result: price
    }
    const status = 200
    callback(status, Requester.success(jobRunID, {
      data,
      status
    }))
  }).catch(() => {
    adapter(input, callback)
  })
}

exports.createRequest = createRequest
