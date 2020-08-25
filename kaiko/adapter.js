const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  if (data.result === 'error') return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  exchange: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toLowerCase()
  const quote = validator.validated.data.quote.toLowerCase()
  const url = `https://us.market-api.kaiko.io/v1/data/trades.v1/spot_exchange_rate/${base}/${quote}`
  const start_time = new Date() // eslint-disable-line camelcase
  start_time.setTime(start_time.getTime() - 1000000)
  const params = {
    interval: '1m',
    sort: 'desc',
    start_time
  }
  const headers = {
    'X-Api-Key': process.env.API_KEY,
    'User-Agent': 'Chainlink'
  }
  const config = {
    url,
    params,
    headers,
    timeout: 10000
  }
  Requester.request(config, customError)
    .then(response => {
      const result = response.data.data.filter(x => x.price !== null)
      response.data.result = Number(Requester.validateResultNumber(result, [0, 'price']))
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
