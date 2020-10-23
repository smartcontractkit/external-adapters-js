const { Requester, Validator } = require('@chainlink/external-adapter')

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base.toUpperCase()
  const market = validator.validated.data.quote.toUpperCase()
  const url = `https://rest.coinapi.io/v1/exchangerate/${coin}/${market}`
  const config = {
    url,
    params: {
      X-CoinAPI-Key: process.env.API_KEY,
    },
  }
  Requester.request(config)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, ['rate'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
