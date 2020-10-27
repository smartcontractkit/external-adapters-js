const { Requester, Validator } = require('@chainlink/external-adapter')

const ENDPOINT_PRICE = 'price'
const ENDPOINT_MKTCAP = 'globalmarketcap'
const ENDPOINT_DOMINANCE = 'dominance'

const DEFAULT_ENDPOINT = ENDPOINT_PRICE

const convertFromTicker = (ticker, coinid, callback) => {
  if (typeof coinId !== 'undefined') return callback(coinid.toLowerCase())

  Requester.request({
    url: 'https://api.coinpaprika.com/v1/coins',
  })
    .then((response) => {
      const coin = response.data
        .sort((a, b) => (a.rank > b.rank ? 1 : -1))
        .find((x) => x.symbol.toLowerCase() === ticker.toLowerCase() && x.rank !== 0)
      if (!coin) return callback('Could not find coin', null)
      return callback(null, coin.id.toLowerCase())
    })
    .catch((error) => callback(error, null))
}

const priceParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false,
}

const price = (jobRunID, input, callback) => {
  const validator = new Validator(input, priceParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const symbol = validator.validated.data.base
  convertFromTicker(symbol, validator.validated.data.coinid, (error, coin) => {
    if (error) return callback(500, Requester.errored(jobRunID, error))
    const url = `https://api.coinpaprika.com/v1/tickers/${coin}`
    const market = validator.validated.data.quote

    const params = {
      quotes: market.toUpperCase(),
    }

    const config = {
      url,
      params,
    }

    Requester.request(config)
      .then((response) => {
        response.data.result = Requester.validateResultNumber(response.data, [
          'quotes',
          market.toUpperCase(),
          'price',
        ])
        callback(response.status, Requester.success(jobRunID, response))
      })
      .catch((error) => callback(500, Requester.errored(jobRunID, error)))
  })
}

const globalParams = {
  market: ['market', 'to', 'quote'],
}

const convert = {
  BTC: 'bitcoin',
}

const dominance = (jobRunID, input, callback) => {
  const validator = new Validator(input, globalParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const url = 'https://api.coinpaprika.com/v1/global'
  const config = { url }

  const symbol = validator.validated.data.market.toUpperCase()

  const _handleResponse = (response) => {
    response.data.result = Requester.validateResultNumber(response.data, [
      `${convert[symbol]}_dominance_percentage`,
    ])
    callback(response.status, Requester.success(jobRunID, response))
  }

  const _handleError = (error) => callback(500, Requester.errored(jobRunID, error))

  Requester.request(config).then(_handleResponse).catch(_handleError)
}

const marketcap = (jobRunID, input, callback) => {
  const validator = new Validator(input, globalParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const url = 'https://api.coinpaprika.com/v1/global'
  const config = { url }

  const symbol = validator.validated.data.market.toLowerCase()

  const _handleResponse = (response) => {
    response.data.result = Requester.validateResultNumber(response.data, [`market_cap_${symbol}`])
    callback(response.status, Requester.success(jobRunID, response))
  }

  const _handleError = (error) => callback(500, Requester.errored(jobRunID, error))

  Requester.request(config).then(_handleResponse).catch(_handleError)
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
    case ENDPOINT_MKTCAP:
      return marketcap(jobRunID, input, callback)
    case ENDPOINT_DOMINANCE:
      return dominance(jobRunID, input, callback)
    default:
      callback(500, Requester.errored(jobRunID, 'invalid endpoint provided'))
  }
}

module.exports.execute = execute
