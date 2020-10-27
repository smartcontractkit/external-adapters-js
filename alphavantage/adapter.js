const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  if (data['Error Message']) return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  function: false,
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const url = 'https://www.alphavantage.co/query'
  const jobRunID = validator.validated.id
  const func = validator.validated.data.function || 'CURRENCY_EXCHANGE_RATE'
  const from = validator.validated.data.base
  const to = validator.validated.data.quote

  const params = {
    function: func,
    from_currency: from,
    to_currency: to,
    from_symbol: from,
    to_symbol: to,
    symbol: from,
    market: to,
    apikey: process.env.API_KEY,
  }

  const config = {
    url,
    params,
  }
  Requester.request(config, customError)
    .then((response) => {
      response.data.result = JSON.parse(
        Requester.validateResultNumber(response.data, [
          'Realtime Currency Exchange Rate',
          '5. Exchange Rate',
        ]),
      )
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
