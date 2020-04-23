const { Requester, Validator } = require('external-adapter')

const customError = (body) => {
  return Object.keys(body.payload).length === 0
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market']
}

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams, callback)
  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const url = `https://web3api.io/api/v2/market/prices/${coin.toLowerCase()}/latest`

  const options = {
    url,
    headers: {
      'x-api-key': process.env.API_KEY
    },
    qs: {
      quote: market.toLowerCase()
    }
  }
  Requester.requestRetry(options, customError)
    .then(response => {
      response.body.result = Requester.validateResult(response.body,
        ['payload', `${coin.toLowerCase()}_${market.toLowerCase()}`, 'price'])
      callback(response.statusCode, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
