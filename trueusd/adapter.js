const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

const execute = (input, callback) => {
  const validator = new Validator(input)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  const url = 'https://core-api.real-time-attest.trustexplorer.io/trusttoken/TrueUSD'

  Requester.request(url, customError)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, [
        'responseData',
        'totalTrust',
      ])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
