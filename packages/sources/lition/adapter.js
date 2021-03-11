const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => data.Response === 'Error'

const customParams = {
  source: ['source'],
  date: false,
  hour: false,
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  const source = validator.validated.data.source
  const currentTime = new Date()
  const date = validator.validated.data.date || `${currentTime.toISOString().slice(0, 10)}` // YYYY-MM-DD
  const hour = validator.validated.data.hour || currentTime.getUTCHours()

  const url = `https://staking.lition.io/api/v1/energy/source/${source}/date/${date}/hour/${hour}/`

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
