const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => (data.Response === 'Error')

const customParams = {
  source: ['source'],
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  const source = validator.validated.data.source

  const url = `https://staking.lition.io/api/v1/energy/source/${source}/date/2020-10-07/hour/15/`

  const config = {
    url,
  }

  Requester.request(config, customError)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, ['price'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
