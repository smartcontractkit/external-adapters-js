const { Requester, Validator } = require('@chainlink/external-adapter')

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  endpoint: false
}

const execute = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'ticker'
  const url = `https://api.bitso.com/v3/${endpoint}/`
  const base = validator.validated.data.base.toLowerCase()
  const quote = validator.validated.data.quote.toLowerCase()
  const book = `${base}_${quote}`

  const params = { book }
  const config = { url, params }

  Requester.request(config)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, ['payload', 'vwap'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.execute = execute
