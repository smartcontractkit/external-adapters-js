const { Requester, Validator } = require('external-adapter')
const { tradingHalted } = require('./marketCheck')
const { getContractPrice } = require('./readReferenceContract')
const adapterCreateRequest = require('./priceAdapter').createRequest

const customParams = {
  base: ['base', 'asset', 'from'],
  contract: ['referenceContract'],
  multiply: false
}

const createRequest = (input, callback) => {
  marketStatusRequest(input, adapterCreateRequest, callback)
}

const marketStatusRequest = (input, adapter, callback) => {
  const validator = new Validator(input, customParams, callback)
  const jobRunID = validator.validated.id
  const contract = validator.validated.data.contract
  const multiply = validator.validated.data.multiply || 100000000
  const symbol = validator.validated.data.base.toUpperCase()

  tradingHalted(symbol, halted => {
    if (!halted) {
      return adapter(input, callback)
    }

    getContractPrice(contract).then(price => {
      price = price / multiply
      if (price <= 0) {
        return adapter(input, callback)
      }

      const body = {
        result: price
      }
      const statusCode = 200
      callback(statusCode, Requester.success(jobRunID, {
        body,
        statusCode
      }))
    }).catch(() => {
      adapter(input, callback)
    })
  })
}

exports.createRequest = createRequest
