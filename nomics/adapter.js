const { Requester, Validator } = require('@chainlink/external-adapter')
const { util } = require('@chainlink/ea-bootstrap')

const ENDPOINT_PRICE = 'price'
<<<<<<< HEAD:nomics/adapter.js
const ENDPOINT_MKTCAP = 'globalmarketcap'
=======
const ENDPOINT_DIFFICULTY = 'difficulty'
const ENDPOINT_HEIGHT = 'height'
>>>>>>> Added height(latest block number) as endpoint parameter on cryptoapis:cryptoapis/adapter.js

const DEFAULT_ENDPOINT = ENDPOINT_PRICE

const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

const priceParams = {
  base: ['base', 'from', 'coin', 'ids'],
  quote: ['quote', 'to', 'market', 'convert'],
}

const convertId = {
  FNX: 'FNX2',
}

const price = (jobRunID, input, callback) => {
  const validator = new Validator(input, priceParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const url = `https://api.nomics.com/v1/currencies/ticker`
  let ids = validator.validated.data.base.toUpperCase()
  const convert = validator.validated.data.quote.toUpperCase()

  // Correct common tickers that are misidentified
  if (ids in convertId) {
    ids = convertId[ids]
  }

  const params = {
    ids,
    convert,
    key: util.getRandomRequiredEnv('API_KEY'),
  }

  const config = {
    url,
<<<<<<< HEAD:nomics/adapter.js
    params,
=======
    headers: {
      'X-API-Key': process.env.API_KEY || util.getRandomRequiredEnv('API_KEY'),
    },
>>>>>>> Renamed endpoint to q. Added READMEs. Cleaned json-rpc.:cryptoapis/adapter.js
  }

  Requester.request(config, customError)
    .then((response) => {
      response.data = response.data[0]
      response.data.result = Requester.validateResultNumber(response.data, ['price'])
      callback(response.status, Requester.success(jobRunID, response))
    })
<<<<<<< HEAD:nomics/adapter.js
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

const globalMarketCap = (jobRunID, input, callback) => {
  const validator = new Validator(input, {})
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const url = `https://api.nomics.com/v1/global-ticker`

  const params = {
    key: util.getRandomRequiredEnv('API_KEY'),
  }
=======
    .catch((error) => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

const latestBlockParams = {
  blockchain: ['blockchain', 'coin'],
  endpoint: false,
  q: false,
  network: false,
}

const latestBlock = (jobRunID, input, callback) => {
  const validator = new Validator(input, latestBlockParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const blockchain = validator.validated.data.blockchain
  const network = validator.validated.data.network || 'mainnet'
  const q = validator.validated.data.q || validator.validated.data.endpoint
  const url = `https://api.cryptoapis.io/v1/bc/${blockchain.toLowerCase()}/${network.toLowerCase()}/blocks/latest`
>>>>>>> Added height(latest block number) as endpoint parameter on cryptoapis:cryptoapis/adapter.js

  const config = {
    url,
<<<<<<< HEAD:nomics/adapter.js
    params,
=======
    headers: {
      'X-API-Key': process.env.API_KEY || util.getRandomRequiredEnv('API_KEY'),
    },
>>>>>>> Renamed endpoint to q. Added READMEs. Cleaned json-rpc.:cryptoapis/adapter.js
  }

<<<<<<< HEAD:nomics/adapter.js
  Requester.request(config, customError)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, ['market_cap'])
=======
  Requester.request(config)
    .then((response) => {
<<<<<<< HEAD:nomics/adapter.js
      response.data.result = Requester.validateResultNumber(response.data, [
        'payload', 
        endpoint
      ])
>>>>>>> Added height(latest block number) as endpoint parameter on cryptoapis:cryptoapis/adapter.js
=======
      response.data.result = Requester.validateResultNumber(response.data, ['payload', q])
>>>>>>> Renamed endpoint to q. Added READMEs. Cleaned json-rpc.:cryptoapis/adapter.js
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

const customParams = {
  endpoint: false,
  q: false,
}

const execute = (input, callback) => {
  // console.log(input)
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  const endpoint =
    validator.validated.data.endpoint || validator.validated.data.q || DEFAULT_ENDPOINT
  switch (endpoint.toLowerCase()) {
    case ENDPOINT_PRICE:
      return price(jobRunID, input, callback)
<<<<<<< HEAD:nomics/adapter.js
    case ENDPOINT_MKTCAP:
      return globalMarketCap(jobRunID, input, callback)
=======
    case ENDPOINT_DIFFICULTY:
    case ENDPOINT_HEIGHT:
      return latestBlock(jobRunID, input, callback)
>>>>>>> Added height(latest block number) as endpoint parameter on cryptoapis:cryptoapis/adapter.js
    default:
      callback(500, Requester.errored(jobRunID, 'invalid endpoint provided'))
  }
}

module.exports.execute = execute
