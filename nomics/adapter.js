const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin', 'ids'],
  quote: ['quote', 'to', 'market', 'convert'],
  endpoint: false,
}

const convertId = {
  FNX: 'FNX2',
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'ticker'
  const url = `https://api.nomics.com/v1/currencies/${endpoint}`
  let ids = validator.validated.data.base.toUpperCase()
  const convert = validator.validated.data.quote.toUpperCase()

  // Correct common tickers that are misidentified
  if (ids in convertId) {
    ids = convertId[ids]
  }

  const params = {
    ids,
    convert,
    key: process.env.API_KEY,
  }

  const config = {
    url,
    params,
  }

  Requester.request(config, customError)
    .then((response) => {
      response.data = response.data[0]
      response.data.result = Requester.validateResultNumber(response.data, ['price'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
