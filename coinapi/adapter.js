const { Requester, Validator } = require('external-adapter')

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market']
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base.toUpperCase()
  const market = validator.validated.data.quote.toUpperCase()
  const url = `https://rest.coinapi.io/v1/exchangerate/${coin}/${market}`
  const config = {
    url,
    params: {
      apikey: process.env.API_KEY
    }
  }
  Requester.request(config)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, ['rate'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
