const { Requester, Validator } = require('external-adapter')

const commonKeys = {
  N225: '^N225',
  FTSE: '^FTSE',
  AUD: 'AUDUSD',
  CHF: 'CHFUSD',
  EUR: 'EURUSD',
  GBP: 'GBPUSD',
  JPY: 'JPYUSD'
}

const customError = (body) => {
  return body.length === 0
}

const customParams = {
  base: ['base', 'asset', 'from'],
  endpoint: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams, callback)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'quote'
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const url = `https://fmpcloud.io/api/v3/${endpoint}/${symbol}`
  const apikey = process.env.API_KEY

  const qs = {
    apikey
  }

  const options = {
    url,
    qs
  }

  Requester.requestRetry(options, customError)
    .then(response => {
      response.body.result = Requester.validateResult(response.body, [0, 'price'])
      callback(response.statusCode, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
