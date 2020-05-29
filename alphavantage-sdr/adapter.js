const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  if (data.status !== '200') return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market']
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const url = 'https://us-central1-alpha-chain-api.cloudfunctions.net/test-api'
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()

  const params = {
    from_symbol: base,
    to_symbol: quote,
    chainlink_node: true
  }

  const config = {
    url,
    params
  }

  Requester.request(config, customError)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, ['result'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
