const { Requester, Validator } = require('@chainlink/external-adapter')
const { util } = require('@chainlink/ea-bootstrap')

const ENDPOINT_PRICE = 'price'
const ENDPOINT_DOMINANCE = 'dominance'
const ENDPOINT_MKTCAP = 'globalmarketcap'

const DEFAULT_ENDPOINT = ENDPOINT_PRICE

const customError = (data) => {
  if (Object.keys(data).length === 0) return true
  return false
}

const priceParams = {
  symbol: ['base', 'from', 'coin', 'sym', 'symbol'],
  convert: ['quote', 'to', 'market', 'convert'],
  cid: false,
}

const price = (jobRunID, input, callback) => {
  const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'
  const validator = new Validator(input, priceParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const symbol = validator.validated.data.symbol
  // CMC allows a coin ID to be specified instead of a symbol
  const cid = validator.validated.data.cid || ''
  // Free CMCPro API only supports a single symbol to convert
  const convert = validator.validated.data.convert
  let params
  if (symbol.length > 0) {
    params = {
      symbol,
      convert,
    }
  } else {
    params = {
      id: cid,
      convert,
    }
  }
  const config = {
    url,
    headers: {
      'X-CMC_PRO_API_KEY': util.pickRandomFromString(process.env.API_KEY, ','),
    },
    params,
  }
  Requester.request(config)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, [
        'data',
        symbol,
        'quote',
        convert,
        'price',
      ])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

const globalParams = {
  market: ['market', 'to', 'quote'],
}

const dominance = (jobRunID, input, callback) => {
  const validator = new Validator(input, globalParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const url = 'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest'

  const headers = {
    'X-CMC_PRO_API_KEY': util.pickRandomFromString(process.env.API_KEY, ','),
  }

  const config = {
    url,
    headers,
  }

  const symbol = validator.validated.data.market.toLowerCase()
  const dataKey = `${symbol}_dominance`

  const _handleResponse = (response) => {
    response.data.result = Requester.validateResultNumber(response.data, ['data', dataKey])
    callback(response.status, Requester.success(jobRunID, response))
  }

  const _handleError = (error) => callback(500, Requester.errored(jobRunID, error))

  Requester.request(config, customError).then(_handleResponse).catch(_handleError)
}

const marketcap = (jobRunID, input, callback) => {
  const validator = new Validator(input, globalParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const convert = validator.validated.data.market.toUpperCase()
  const url = 'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest'

  const params = { convert }
  const headers = {
    'X-CMC_PRO_API_KEY': util.pickRandomFromString(process.env.API_KEY, ','),
  }

  const config = {
    url,
    params,
    headers,
  }

  const _handleResponse = (response) => {
    response.data.result = Requester.validateResultNumber(response.data, [
      'data',
      'quote',
      convert,
      'total_market_cap',
    ])
    callback(response.status, Requester.success(jobRunID, response))
  }

  const _handleError = (error) => callback(500, Requester.errored(jobRunID, error))

  Requester.request(config, customError).then(_handleResponse).catch(_handleError)
}

const customParams = {
  endpoint: false,
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  switch (endpoint.toLowerCase()) {
    case ENDPOINT_PRICE:
      return price(jobRunID, input, callback)
    case ENDPOINT_DOMINANCE:
      return dominance(jobRunID, input, callback)
    case ENDPOINT_MKTCAP:
      return marketcap(jobRunID, input, callback)
    default:
      callback(500, Requester.errored(jobRunID, 'invalid endpoint provided'))
  }
}

module.exports.execute = execute
