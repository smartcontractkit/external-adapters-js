const { Requester, Validator } = require('external-adapter')

const customError = (body) => {
  if (body.result === 'error') return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  exchange: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams, callback)
  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toLowerCase()
  const quote = validator.validated.data.quote.toLowerCase()
  const url = `https://us.market-api.kaiko.io/v1/data/trades.v1/spot_exchange_rate/${base}/${quote}`
  const start_time = new Date() // eslint-disable-line camelcase
  start_time.setTime(start_time.getTime() - 1000000)
  const qs = {
    interval: '5m',
    sort: 'desc',
    start_time
  }
  const headers = {
    'X-Api-Key': process.env.API_KEY,
    'User-Agent': 'Chainlink'
  }
  const options = {
    url,
    qs,
    headers,
    timeout: '10000'
  }
  Requester.requestRetry(options, customError)
    .then(response => {
      response.body.result = Number(Requester.validateResult(response.body, ['data', 0, 'price']))
      callback(response.statusCode, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
