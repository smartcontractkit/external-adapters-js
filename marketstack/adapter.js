const { Requester, Validator } = require('@chainlink/external-adapter')
const { util } = require('@chainlink/ea-bootstrap')
const API_KEY = util.pickRandomFromString(process.env.API_KEY, ',')
const DEFAULT_INTERVAL = '1min'
const DEFAULT_LIMIT = 1
const DEFAULT_ENDPOINT = 'intraday'

const customParams = {
  base: ['base', 'from', 'asset'],
  endpoint: false,
  interval: false,
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  const url = `http://api.marketstack.com/v1/${endpoint}`
  const symbols = validator.validated.data.base.toUpperCase()
  const interval = validator.validated.data.interval || DEFAULT_INTERVAL
  const limit = validator.validated.data.limit || DEFAULT_LIMIT

  const params = {
    symbols,
    access_key: API_KEY,
    interval,
    limit,
  }

  const config = {
    url,
    params,
  }

  Requester.request(config)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, ['data', 0, 'close'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
