const { Requester, Validator } = require('external-adapter')

const customError = (body) => {
  if (body['Error Message']) return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  function: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams, callback)
  const url = 'https://www.alphavantage.co/query'
  const jobRunID = validator.validated.id
  const func = validator.validated.data.function || 'CURRENCY_EXCHANGE_RATE'
  const from = validator.validated.data.base
  const to = validator.validated.data.quote

  const qs = {
    function: func,
    from_currency: from,
    to_currency: to,
    from_symbol: from,
    to_symbol: to,
    symbol: from,
    market: to,
    apikey: process.env.API_KEY
  }

  const options = {
    url,
    qs
  }
  Requester.requestRetry(options, customError)
    .then(response => {
      response.body.result = JSON.parse(Requester.validateResult(
        response.body, ['Realtime Currency Exchange Rate', '5. Exchange Rate']))
      callback(response.statusCode, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
