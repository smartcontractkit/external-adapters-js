const { Requester, Validator } = require('external-adapter')

const commonKeys = {
  N225: '^N225',
  FTSE: '^FTSE',
  XAU: 'OANDA:XAU_USD',
  XAG: 'OANDA:XAG_USD',
  AUD: 'OANDA:AUD_USD',
  EUR: 'OANDA:EUR_USD',
  GBP: 'OANDA:GBP_USD'
  // CHF & JPY are not supported
}

const customParams = {
  base: ['base', 'asset', 'from'],
  endpoint: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams, callback)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'quote'
  const url = `https://finnhub.io/api/v1/${endpoint}`
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const token = process.env.API_KEY

  const qs = {
    symbol,
    token
  }

  const options = {
    url,
    qs
  }

  Requester.requestRetry(options)
    .then(response => {
      response.body.result = Requester.validateResult(response.body, ['c'])
      callback(response.statusCode, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
