const { Requester, Validator } = require('external-adapter')

const customParams = {
  base: ['base', 'from'],
  quote: ['quote', 'to'],
  endpoint: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams, callback)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'latest.json'
  const url = `https://openexchangerates.org/api/${endpoint}`
  const base = validator.validated.data.base.toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()

  const qs = {
    base,
    app_id: process.env.API_KEY
  }

  const options = {
    url,
    qs
  }

  Requester.requestRetry(options)
    .then(response => {
      response.body.result = Requester.validateResult(response.body, ['rates', to])
      callback(response.statusCode, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
