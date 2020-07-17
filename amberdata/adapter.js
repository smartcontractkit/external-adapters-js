const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  return Object.keys(data.payload).length === 0
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market']
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const url = `https://web3api.io/api/v2/market/prices/${coin.toLowerCase()}_${market.toLowerCase()}/latest`

  const config = {
    url,
    headers: {
      'x-api-key': process.env.API_KEY
    }
  }
  Requester.request(config, customError)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data,
        ['payload', `${coin.toLowerCase()}_${market.toLowerCase()}`, 'price'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
