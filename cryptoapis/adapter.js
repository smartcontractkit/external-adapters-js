const { Requester, Validator } = require('@chainlink/external-adapter')

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  endpoint: false,
}

const execute = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'exchange-rates'
  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const url = `https://api.cryptoapis.io/v1/${endpoint}/${coin}/${market}`

  const config = {
    url,
    headers: {
      'X-API-Key': process.env.API_KEY,
    },
  }
  Requester.request(config)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, [
        'payload',
        'weightedAveragePrice',
      ])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.execute = execute
