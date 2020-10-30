const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  return Object.keys(data.payload).length === 0
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const url = `https://web3api.io/api/v2/market/spot/prices/pairs/${coin.toLowerCase()}_${market.toLowerCase()}/latest`

  const config = {
    url,
    headers: {
      'x-api-key': process.env.API_KEY,
    },
    params: {
      includeCrossRates: true,
    },
  }
  Requester.request(config, customError)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, ['payload', 'price'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
