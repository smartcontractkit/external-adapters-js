const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  if (Object.keys(data).length < 1) return true
  if (!('health' in data) || !data.health) return true
  return false
}

const customParams = {
  speed: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed || 'standard'
  const url = 'https://gasprice.poa.network/'

  Requester.request(url, customError)
    .then((response) => {
      response.data.result =
        Requester.validateResultNumber(response.data, [speed]) * 1e9
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
