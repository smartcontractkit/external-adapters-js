const { Requester, Validator } = require('external-adapter')

const customError = (data) => {
  if (Object.keys(data).length === 0) return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  coinid: false
}

const convertFromTicker = (ticker, coinId, callback) => {
  if (typeof coinId !== 'undefined') return callback(coinId.toLowerCase())

  Requester.request({
    url: 'https://api.coingecko.com/api/v3/coins/list'
  }, customError)
    .then(response => {
      const coin = response.data.find(x => x.symbol.toLowerCase() === ticker.toLowerCase())
      if (typeof coin === 'undefined') {
        return callback('undefined')
      }
      return callback(coin.id.toLowerCase())
    })
    .catch(() => {
      return callback('Could not find data')
    })
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base
  convertFromTicker(symbol, validator.validated.data.coinid, (coin) => {
    const url = 'https://api.coingecko.com/api/v3/simple/price'
    const market = validator.validated.data.quote

    const params = {
      ids: coin,
      vs_currencies: market
    }

    const config = {
      url: url,
      params
    }
    Requester.request(config, customError)
      .then(response => {
        response.data.result = Requester.validateResultNumber(response.data, [coin.toLowerCase(), market.toLowerCase()])
        callback(response.status, Requester.success(jobRunID, response))
      })
      .catch(error => {
        callback(500, Requester.errored(jobRunID, error))
      })
  })
}

module.exports.createRequest = createRequest
