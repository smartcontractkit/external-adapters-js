const { Requester, Validator } = require('external-adapter')

const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin', 'fsym'],
  quote: ['quote', 'to', 'market', 'tsyms'],
  endpoint: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'price'
  const url = `https://min-api.cryptocompare.com/data/${endpoint}`
  const fsym = validator.validated.data.base.toUpperCase()
  const tsyms = validator.validated.data.quote.toUpperCase()

  const params = {
    fsym,
    tsyms
  }

  const config = {
    url,
    params
  }

  Requester.request(config, customError)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, [tsyms])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
