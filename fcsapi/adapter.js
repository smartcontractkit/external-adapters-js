const { Requester, Validator } = require('external-adapter')

const customError = (body) => {
  if (body.msg !== 'Successfully') return true
  return false
}

const commonKeys = {
  AUD: { id: '13', endpoint: 'forex/latest' },
  CHF: { id: '466', endpoint: 'forex/latest' },
  EUR: { id: '1', endpoint: 'forex/latest' },
  GBP: { id: '39', endpoint: 'forex/latest' },
  JPY: { id: '1075', endpoint: 'forex/latest' },
  XAU: { id: '1984', endpoint: 'forex/latest' },
  XAG: { id: '1975', endpoint: 'forex/latest' },
  N225: { id: '268', endpoint: 'stock/indices_latest' },
  FTSE: { id: '529', endpoint: 'stock/indices_latest' }
}

const customParams = {
  base: ['base', 'asset', 'from'],
  endpoint: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams, callback)
  const jobRunID = validator.validated.id
  let symbol = validator.validated.data.base.toUpperCase()
  let endpoint = validator.validated.data.endpoint
  if (commonKeys[symbol]) {
    endpoint = commonKeys[symbol].endpoint
    symbol = commonKeys[symbol].id
  }
  const url = `https://fcsapi.com/api-v2/${endpoint}`
  const access_key = process.env.API_KEY // eslint-disable-line camelcase

  const qs = {
    access_key,
    id: symbol
  }

  const options = {
    url,
    qs
  }

  Requester.requestRetry(options, customError)
    .then(response => {
      response.body.result = Requester.validateResult(response.body, ['response', 0, 'price'])
      callback(response.statusCode, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
