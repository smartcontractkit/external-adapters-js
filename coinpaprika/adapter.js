const { Requester, Validator } = require('@chainlink/external-adapter')

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false
}

const convertFromTicker = (ticker, coinid, callback) => {
  if (typeof coinId !== 'undefined') return callback(coinid.toLowerCase())

  Requester.request({
    url: 'https://api.coinpaprika.com/v1/coins'
  }).then(response => {
    const coin = response.data.sort((a, b) => (a.rank > b.rank) ? 1 : -1)
      .find(x => x.symbol.toLowerCase() === ticker.toLowerCase() && x.rank !== 0)
    if (typeof coin === 'undefined') {
      return callback('Could not find coin', null)
    }
    return callback(null, coin.id.toLowerCase())
  }).catch(error => {
    return callback(error, null)
  })
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base
  convertFromTicker(symbol, validator.validated.data.coinid, (error, coin) => {
    if (error !== null) {
      return callback(500, Requester.errored(jobRunID, error))
    }
    const url = `https://api.coinpaprika.com/v1/tickers/${coin}`
    const market = validator.validated.data.quote

    const params = {
      quotes: market.toUpperCase()
    }

    const config = {
      url,
      params
    }

    Requester.request(config)
      .then(response => {
        response.data.result = Requester.validateResultNumber(response.data, ['quotes', market.toUpperCase(), 'price'])
        callback(response.status, Requester.success(jobRunID, response))
      })
      .catch(error => {
        callback(500, Requester.errored(jobRunID, error))
      })
  })
}

module.exports.createRequest = createRequest
