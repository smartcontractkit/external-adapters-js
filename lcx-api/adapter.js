const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  return !data || !data.data || !data.data.Price
}

const customParams = {
  symbol: false
}

const headers = {
  'Content-Type': 'application/json',
  'api-key': process.env.API_KEY
}

const ALL = 'all'
const SYMBOLS = ['btc-usd', 'btc-eur', 'eth-usd', 'eth-eur']

function getUrlForSymbol (symbol) {
  if (symbol === ALL) {
    return SYMBOLS.map(i => getUrlForSymbol(i))
  } else {
    const s = symbol.split('-')
    return `https://rp.lcx.com/v1/rates/current/?coin=${s[0].toUpperCase()}&currency=${s[1].toUpperCase()}`
  }
}

function retrieveRates (url) {
  return Requester.request({
    url,
    headers
  }, customError)
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol || 'all'

  if (symbol === ALL) {
    Promise.all(getUrlForSymbol(symbol).map(url => retrieveRates(url)))
      .then(responses => {
        const r = {
          data: {
            result: {}
          },
          status: 200
        }
        for (let i = 0; i < SYMBOLS.length; ++i) {
          r.data[SYMBOLS[i]] = responses[i].data
          r.data.result[SYMBOLS[i]] = Requester.validateResultNumber(responses[i].data.data, ['Price'])
        }
        callback(200, Requester.success(jobRunID, r))
      }).catch(error => {
        callback(500, Requester.errored(jobRunID, error))
      })
  } else if (!SYMBOLS.includes(symbol)) {
    callback(400, Requester.errored(jobRunID, `Illegal symbol: ${symbol}`))
  } else {
    retrieveRates(getUrlForSymbol(symbol))
      .then(response => {
        response.data.result = Requester.validateResultNumber(response.data.data, ['Price'])
        callback(response.status, Requester.success(jobRunID, response))
      })
      .catch(error => {
        callback(500, Requester.errored(jobRunID, error))
      })
  }
}

module.exports.createRequest = createRequest
