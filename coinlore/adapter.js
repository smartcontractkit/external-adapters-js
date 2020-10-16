const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

const execute = (input, callback) => {
  const validator = new Validator(input)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  const url = 'https://api.coinlore.net/api/global/'

  Requester.request(url, customError)
    .then((response) => {
      response.data = response.data[0]
      response.data.result = Requester.validateResultNumber(response.data, ['btc_d'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
