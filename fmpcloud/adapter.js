const { Requester, Validator } = require('@chainlink/external-adapter')

const commonKeys = {
  N225: '^N225',
  FTSE: '^FTSE',
  AUD: 'AUDUSD',
  CHF: 'CHFUSD',
  EUR: 'EURUSD',
  GBP: 'GBPUSD',
  JPY: 'JPYUSD',
}

const customError = (data) => {
  return data.length === 0
}

const customParams = {
  base: ['base', 'asset', 'from'],
  endpoint: false,
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'quote'
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const url = `https://fmpcloud.io/api/v3/${endpoint}/${symbol}`
  const apikey = process.env.API_KEY

  const params = {
    apikey,
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
