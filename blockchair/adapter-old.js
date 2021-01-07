const { Requester, Validator } = require('@chainlink/external-adapter')
const { util } = require('@chainlink/ea-bootstrap')

const customParams = {
  blockchain: ['blockchain', 'coin'],
  endpoint: false,
}

const convertBlockchain = {
  BTC: 'bitcoin',
  BCH: 'bitcoin-cash',
  BSV: 'bitcoin-sv',
  ETH: 'ethereum',
  LTC: 'litecoin',
}

const convertEndpoint = {
  height: 'blocks',
}


const stats = (jobRunID, input, callback) => {
  const validator = new Validator(input, latestBlockParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const blockchain = validator.validated.data.blockchain
  const network = validator.validated.data.network || 'mainnet'
  const endpoint = validator.validated.data.endpoint
  const url = `https://api.cryptoapis.io/v1/bc/${blockchain.toLowerCase()}/${network.toLowerCase()}/blocks/latest`

  const config = {
    url,
    headers: {
      'X-API-Key': process.env.API_KEY,
    },
  }

  Requester.request(config)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, [
        'payload', 
        endpoint
      ])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => {
      callback(500, Requester.errored(jobRunID, error))
    })
}
const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  let blockchain = validator.validated.data.blockchain
  let endpoint = validator.validated.data.endpoint || 'difficulty'

  if (blockchain in convertBlockchain) blockchain = convertBlockchain[blockchain]
  if (endpoint in convertEndpoint) endpoint = convertEndpoint[endpoint]

  
  const url = `https://api.blockchair.com/${blockchain.toLowerCase()}/stats`
  const key = util.getRandomRequiredEnv('API_KEY')

  const params = {}
  if (key.length > 0) params.key = key

  const config = { url, params }
  Requester.request(config)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, ['data', endpoint])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
