const { Requester, Validator } = require('@chainlink/external-adapter')
const { util } = require('@chainlink/ea-bootstrap')

const ENDPOINT_PRICE = 'price'
const ENDPOINT_DIFFICULTY = 'difficulty'

const DEFAULT_ENDPOINT = ENDPOINT_PRICE

const priceParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

const price = (jobRunID, input, callback) => {
  const validator = new Validator(input, priceParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const url = `https://api.cryptoapis.io/v1/exchange-rates/${coin}/${market}`

  const config = {
    url,
    headers: {
      'X-API-Key': util.pickRandomFromString(process.env.API_KEY, ','),
    },
  }
  Requester.request(config)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, [
        'payload',
        'weightedAveragePrice',
      ])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

const difficultyParams = {
  blockchain: ['blockchain', 'coin'],
  network: false,
}

const difficulty = (jobRunID, input, callback) => {
  const validator = new Validator(input, difficultyParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const blockchain = validator.validated.data.blockchain
  const network = validator.validated.data.network || 'mainnet'
  const url = `https://api.cryptoapis.io/v1/bc/${blockchain.toLowerCase()}/${network.toLowerCase()}/blocks/latest`

  const config = {
    url,
    headers: {
      'X-API-Key': util.pickRandomFromString(process.env.API_KEY, ','),
    },
  }
  Requester.request(config)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, [
        'payload',
        'difficulty',
      ])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

const customParams = {
  endpoint: false,
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  switch (endpoint.toLowerCase()) {
    case ENDPOINT_PRICE:
      return price(jobRunID, input, callback)
    case ENDPOINT_DIFFICULTY:
      return difficulty(jobRunID, input, callback)
    default:
      callback(500, Requester.errored(jobRunID, 'invalid endpoint provided'))
  }
}

module.exports.execute = execute
