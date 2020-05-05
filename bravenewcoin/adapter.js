const { Requester, Validator } = require('external-adapter')

const customParams = {
  from: ['base', 'from', 'coin'],
  to: ['quote', 'to', 'market']
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const host = 'bravenewcoin-v1.p.rapidapi.com'
  const url = 'https://' + host + '/convert'
  const jobRunID = validator.validated.id
  const from = validator.validated.data.from
  const to = validator.validated.data.to
  const params = {
    qty: 1,
    from,
    to
  }
  const config = {
    url,
    headers: {
      'x-rapidapi-host': host,
      'x-rapidapi-key': process.env.API_KEY
    },
    params
  }
  Requester.request(config)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, ['to_quantity'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
