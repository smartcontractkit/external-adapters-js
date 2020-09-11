const { Requester, Validator } = require('@chainlink/external-adapter')

const customParams = {
  base: ['base', 'from'],
  quote: ['quote', 'to'],
  endpoint: false,
  amount: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'convert'
  const url = `https://api.currencylayer.com/${endpoint}`
  const from = validator.validated.data.base.toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const amount = validator.validated.data.amount || 1
  const access_key = process.env.API_KEY // eslint-disable-line camelcase

  const params = {
    from,
    to,
    amount,
    access_key
  }

  const config = {
    url,
    params
  }

  Requester.request(config)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, ['result'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
