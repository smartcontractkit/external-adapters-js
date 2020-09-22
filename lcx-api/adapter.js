const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  return !data || !data.data || !data.data.Price
}

const symbolEndpointParams = {
  pair: true
}

const customParams = {
  endpoint: false
}

const headers = {
  'Content-Type': 'application/json',
  'api-key': process.env.API_KEY
}

const ENDPOINT_SYMBOL = 'symbol'
const ENDPOINT_ALL_SYMBOLS = 'all'

const DEFAULT_ENDPOINT = ENDPOINT_ALL_SYMBOLS

const SYMBOLS = ['btc-usd', 'btc-eur', 'eth-usd', 'eth-eur']

function getUrlForSymbol (symbol) {
  const s = symbol.toUpperCase().split('-')
  return `https://rp.lcx.com/v1/rates/current/?coin=${s[0]}&currency=${s[1]}`
}

const getAllUrls = () => SYMBOLS.map(i => getUrlForSymbol(i))

const retrieveRates = (url) =>
  Requester.request({
    url,
    headers
  }, customError)

const symbolEndpoint = (jobRunID, input, callback) => {
  const validator = new Validator(callback, input, symbolEndpointParams)
  const symbol = validator.validated.data.pair

  if (!SYMBOLS.includes(symbol)) {
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

const allSymbolsEndpoint = (jobRunID, input, callback) => {
  Promise.all(getAllUrls().map(url => retrieveRates(url)))
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
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  switch (endpoint.toLowerCase()) {
    case ENDPOINT_ALL_SYMBOLS:
      return allSymbolsEndpoint(jobRunID, input, callback)
    case ENDPOINT_SYMBOL:
      return symbolEndpoint(jobRunID, input, callback)
    default:
      callback(500, Requester.errored(jobRunID, 'invalid endpoint provided'))
  }
}

module.exports.createRequest = createRequest
