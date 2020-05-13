const { Requester, Validator } = require('@chainlink/external-adapter')

const customParams = {
  base: ['base', 'from'],
  quote: ['quote', 'to'],
  endpoint: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'latest.json'
  const url = `https://openexchangerates.org/api/${endpoint}`
  const base = validator.validated.data.base.toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()

  const params = {
    base,
    app_id: process.env.API_KEY
  }

  const config = {
    url,
    params
  }

  Requester.request(config)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, ['rates', to])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
