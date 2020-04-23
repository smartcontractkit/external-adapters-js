const { Requester, Validator } = require('external-adapter')

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false
}

const convertFromTicker = (ticker, coinid, callback) => {
  if (typeof coinId !== 'undefined') return callback(coinid.toLowerCase())

  Requester.requestRetry({
    url: 'https://api.coinpaprika.com/v1/coins'
  }).then(response => {
    const coin = response.body.sort((a, b) => (a.rank > b.rank) ? 1 : -1)
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
  const validator = new Validator(input, customParams, callback)
  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base
  convertFromTicker(symbol, validator.validated.data.coinid, (error, coin) => {
    if (error !== null) {
      return callback(500, Requester.errored(jobRunID, error))
    }
    const url = `https://api.coinpaprika.com/v1/tickers/${coin}`
    const market = validator.validated.data.quote

    const qs = {
      quotes: market.toUpperCase()
    }

    const options = {
      url,
      qs
    }

    Requester.requestRetry(options)
      .then(response => {
        response.body.result = Requester.validateResult(response.body, ['quotes', market.toUpperCase(), 'price'])
        callback(response.statusCode, Requester.success(jobRunID, response))
      })
      .catch(error => {
        callback(500, Requester.errored(jobRunID, error))
      })
  })
}

exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data)
  })
}

exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data)
  })
}

module.exports.createRequest = createRequest
