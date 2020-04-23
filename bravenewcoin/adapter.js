const { Requester, Validator } = require('external-adapter')

const customParams = {
  from: ['base', 'from', 'coin'],
  to: ['quote', 'to', 'market']
}

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams, callback)
  const host = 'bravenewcoin-v1.p.rapidapi.com'
  const url = 'https://' + host + '/convert'
  const jobRunID = validator.validated.id
  const from = validator.validated.data.from
  const to = validator.validated.data.to
  const qs = {
    qty: 1,
    from,
    to
  }
  const options = {
    url,
    headers: {
      'x-rapidapi-host': host,
      'x-rapidapi-key': process.env.API_KEY
    },
    qs
  }
  Requester.requestRetry(options)
    .then(response => {
      response.body.result = Requester.validateResult(response.body, ['to_quantity'])
      callback(response.statusCode, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
