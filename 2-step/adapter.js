const { Requester, Validator, logger } = require('@chainlink/external-adapter')
const { getContractPrice } = require('../helpers/eth-adapter-helper')
const adapterCreateRequest = require('./priceAdapter').createRequest

const customParams = {
  base: ['base', 'asset', 'from'],
  contract: ['referenceContract'],
  multiply: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const contract = validator.validated.data.contract
  const multiply = validator.validated.data.multiply || 100000000

  logger.info('Getting value from contract: ' + contract)
  getContractPrice(contract).then(price => {
    price = price / multiply
    logger.info('Value: ' + price)
    if (price <= 0) {
      return callback(500, Requester.errored(jobRunID, 'on-chain value equal or less than 0'))
    }

    adapterCreateRequest(input, (statusCode, response) => {
      if (response.status === 'errored') {
        return callback(statusCode, response)
      }

      const result = response.result * price
      response.data.result = result
      response.result = result
      return callback(statusCode, response)
    })
  }).catch((error) => {
    logger.error('Error reading contract')
    logger.error(error.toString())
    return callback(500, Requester.errored(jobRunID, error.toString()))
  })
}

exports.createRequest = createRequest
