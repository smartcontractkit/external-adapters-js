const { Requester, Validator } = require('@chainlink/external-adapter')

const ENDPOINT_DOMINANCE = 'dominance'

const DEFAULT_ENDPOINT = ENDPOINT_DOMINANCE

const globalParams = {
  base: ['market', 'to', 'quote'],
}

const global = (jobRunID, input, path, coinPrefix, callback) => {
  const validator = new Validator(input, globalParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const url = 'https://api.coinlore.net/api/global/'
  const config = { url }

  const symbol = validator.validated.data.base.toLowerCase()
  const dataKey = coinPrefix ? `${symbol}_${path}` : path

  const _handleResponse = (response) => {
    response.data = response.data[0]
    response.data.result = Requester.validateResultNumber(response.data, [dataKey])
    callback(response.status, Requester.success(jobRunID, response))
  }

  const _handleError = (error) => callback(500, Requester.errored(jobRunID, error))

  Requester.request(config).then(_handleResponse).catch(_handleError)
}

const customParams = {
  endpoint: false,
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  switch (endpoint.toLowerCase()) {
    case ENDPOINT_DOMINANCE:
      return global(jobRunID, input, 'd', true, callback)
    default:
      callback(500, Requester.errored(jobRunID, 'invalid endpoint provided'))
  }
}

module.exports.execute = execute
