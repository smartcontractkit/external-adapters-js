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

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  let blockchain = validator.validated.data.blockchain
  let q = validator.validated.data.q || 'difficulty'

  if (blockchain in convertBlockchain) blockchain = convertBlockchain[blockchain]
  if (q in convertEndpoint) q = convertEndpoint[q]

  const url = `https://api.blockchair.com/${blockchain.toLowerCase()}/stats`
  const key = process.env.API_KEY || util.getRandomRequiredEnv('API_KEY')

  const params = {}
  if (key.length > 0) params.key = key

  const config = { url, params }
  Requester.request(config)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, ['data', q])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
