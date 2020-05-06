const { Requester, Validator } = require('external-adapter')

const customError = (data) => {
  return Object.keys(data.payload).length < 1
}

const customParams = {
  speed: ['speed'],
  blockchain: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed
  const endpoint = validator.validated.data.blockchain || 'ethereum-mainnet'
  const url = 'https://web3api.io/api/v2/transactions/gas/predictions'

  const config = {
    url,
    headers: {
      'x-api-key': process.env.API_KEY,
      'x-amberdata-blockchain-id': endpoint
    }
  }

  Requester.request(config, customError)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, ['payload', speed, 'gasPrice'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
