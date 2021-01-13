const { Requester, Validator } = require('@chainlink/external-adapter')
const { util } = require('@chainlink/ea-bootstrap')

const customError = (data) => {
  if (data.result === 'error') return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

const convertId = {
  uni: 'uniswap',
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  let base = validator.validated.data.base.toLowerCase()
  const quote = validator.validated.data.quote.toLowerCase()

  // Correct common tickers that are misidentified
  if (base in convertId) {
    base = convertId[base]
  }

  let url = 'https://us.market-api.kaiko.io'
  if (quote === 'eth') {
    url += `/v2/data/trades.v1/spot_direct_exchange_rate/${base}/${quote}`
  } else {
    url += `/v2/data/trades.v1/spot_exchange_rate/${base}/${quote}`
  }

  const start_time = new Date() // eslint-disable-line camelcase
  start_time.setTime(start_time.getTime() - 1000000)
  const params = {
    interval: '1m',
    sort: 'desc',
    start_time,
  }
  const headers = {
    'X-Api-Key': util.getRandomRequiredEnv('API_KEY'),
    'User-Agent': 'Chainlink',
  }
  const config = {
    url,
    params,
    headers,
    timeout: 10000,
  }
  Requester.request(config, customError)
    .then((response) => {
      const result = response.data.data.filter((x) => x.price !== null)
      response.data.result = Number(Requester.validateResultNumber(result, [0, 'price']))
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
