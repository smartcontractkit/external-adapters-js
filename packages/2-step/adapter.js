const { Requester, Validator, logger } = require('@chainlink/external-adapter')
const { getContractPrice } = require('../helpers/eth-adapter-helper')
const adapterExecute = require('./priceAdapter').execute

const customParams = {
  contract: ['referenceContract'],
  multiply: false,
  operator: ['operator'],
  dividend: false,
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

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

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

  logger.debug('Getting value from contract: ' + contract)
  getContractPrice(contract)
    .then((price) => {
      price = price / multiply
      logger.debug('Value: ' + price)
      if (price <= 0) {
        return callback(500, Requester.errored(jobRunID, 'on-chain value equal or less than 0'))
      }

      adapterExecute(input, (statusCode, response) => {
        if (response.status === 'errored') {
          return callback(statusCode, response)
        }

        const result = transform(response.result, price, operator, dividend)
        logger.debug('New result: ' + result)

        response.data.result = result
        response.result = result
        return callback(statusCode, response)
      })
    })
    .catch((error) => {
      logger.error('Error reading contract')
      logger.error(error.toString())
      return callback(500, Requester.errored(jobRunID, error.toString()))
    })
}

exports.execute = execute
