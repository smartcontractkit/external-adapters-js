const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  if (Object.keys(data).length < 1) return true
  return false
}

const customParams = {
  speed: true,
  endpoint: false,
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'gasPriceOracle'
  const speed = validator.validated.data.speed || 'standard'
  const url = `https://www.etherchain.org/api/${endpoint}`

  Requester.request(url, customError)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, [speed]) * 1e9
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
