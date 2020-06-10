const { Requester, Validator, logger } = require('@chainlink/external-adapter')
const { getContractPrice } = require('../helpers/eth-adapter-helper')
const adapterCreateRequest = require('./priceAdapter').createRequest

const customParams = {
  contract: ['referenceContract'],
  multiply: false,
  operator: ['operator'],
  dividend: false
}

const transform = (offchain, onchain, operator, dividendConfig) => {
  if (operator === 'multiply') {
    return offchain * onchain
  } else if (operator === 'divide') {
    let dividend = offchain
    let divisor = onchain
    if (dividendConfig === 'on-chain') {
      dividend = onchain
      divisor = offchain
    }
    return dividend / divisor
  }
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const contract = validator.validated.data.contract
  const multiply = validator.validated.data.multiply || 100000000
  const operator = validator.validated.data.operator
  const dividend = validator.validated.data.dividend || 'off-chain'
  if (operator !== 'multiply' && operator !== 'divide') {
    return callback(400, Requester.errored(jobRunID, 'invalid operator'))
  }

  if (dividend !== 'on-chain' && dividend !== 'off-chain') {
    return callback(400, Requester.errored(jobRunID, 'invalid dividend'))
  }

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

      const result = transform(response.result, price, operator, dividend)
      logger.info('New result: ' + result)

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
