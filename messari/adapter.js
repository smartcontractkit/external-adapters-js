const { Requester, Validator } = require('@chainlink/external-adapter')

const ENDPOINT_MKTDOM = 'globalmarketdom'

const DEFAULT_ENDPOINT = ENDPOINT_MKTDOM

const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

const mktdomParams = {
  base: ['base', 'from', 'coin'],
}

const globalMarketDom = (jobRunID, input, callback) => {
  const validator = new Validator(input, mktdomParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const base = validator.validated.data.base.toLowerCase()
  const url = `https://data.messari.io/api/v1/assets/${base}/metrics`

  const config = {
    url: url,
  }
  
  Requester.request(config, customError)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, ['data', 'marketcap', 'marketcap_dominance_percent'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
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
    case ENDPOINT_MKTDOM: 
      return globalMarketDom(jobRunID, input, callback)
    default:
      callback(500, Requester.errored(jobRunID, 'invalid endpoint provided'))
  }
}

module.exports.execute = execute
