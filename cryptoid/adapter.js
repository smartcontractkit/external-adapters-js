const { Requester, Validator } = require('@chainlink/external-adapter')
const { util } = require('@chainlink/ea-bootstrap')

const customParams = {
  blockchain: ['blockchain', 'coin'],
  endpoint: false
}

const endpointToQ = {
  difficulty : 'getdifficulty',
  height : 'getblockcount'
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  const blockchain = validator.validated.data.blockchain.toLowerCase()
  const endpoint = validator.validated.data.endpoint || 'difficulty'
  const url = `https://${blockchain}.cryptoid.info/${blockchain}/api.dws`
  const key = util.getRandomRequiredEnv('API_KEY')
  const q = endpointToQ[endpoint]
  const params = { key, q }
  const config = { url, params }

  Requester.request(config)
    .then((response) => ({ ...response, data: { result: response.data } }))
    .then((response) => callback(response.status, Requester.success(jobRunID, response)))
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
