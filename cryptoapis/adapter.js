const { Requester, Validator } = require('external-adapter')

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  endpoint: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams, callback)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'exchange-rates'
  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const url = `https://api.cryptoapis.io/v1/${endpoint}/${coin}/${market}`

  const options = {
    url,
    headers: {
      'X-API-Key': process.env.API_KEY
    }
  }
  Requester.requestRetry(options)
    .then(response => {
      response.body.result = Requester.validateResult(response.body, ['payload', 'weightedAveragePrice'])
      callback(response.statusCode, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
