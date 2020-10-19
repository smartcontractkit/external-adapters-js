const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  endpoint: false,
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'price'
  const url = `http://localhost:18081/${endpoint}`
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()

  const params = {
    base,
    quote,
  }

  const config = {
    url,
    params,
  }

  Requester.request(config, customError)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, ['price'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
