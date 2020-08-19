const { Requester, Validator } = require('@chainlink/external-adapter')

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  endpoint: false
}

const execute = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'tickers'
  const base = validator.validated.data.base.toLowerCase()
  const quote = validator.validated.data.quote.toLowerCase()
  const url = `https://bitex.la/api/${endpoint}/${base}_${quote}`

  const config = {
    url
  }

  Requester.request(config)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, ['data', 'attributes', 'vwap'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.execute = execute
