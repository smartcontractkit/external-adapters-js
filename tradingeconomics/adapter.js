const { Requester, Validator } = require('@chainlink/external-adapter')
const TeClient = require('tradingeconomics-stream')
const API_CLIENT_KEY = process.env.API_CLIENT_KEY
const API_CLIENT_SECRET = process.env.API_CLIENT_SECRET
const DEFAULT_WS_TIMEOUT = 5000
const wsTimeout = process.env.WS_TIMEOUT || DEFAULT_WS_TIMEOUT

const customParams = {
  base: ['base', 'from', 'asset']
}

const commonSymbols = {
  N225: 'NKY:IND',
  FTSE: 'UKX:IND'
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  let symbol = validator.validated.data.base.toUpperCase()
  if (symbol in commonSymbols) {
    symbol = commonSymbols[symbol]
  }

  const client = new TeClient({
    url: 'ws://stream.tradingeconomics.com/',
    key: API_CLIENT_KEY,
    secret: API_CLIENT_SECRET,
    reconnect: false
  })

  client.subscribe(symbol)

  let completed = false

  client.on('message', msg => {
    completed = true
    const response = {
      data: msg,
      status: 200
    }
    response.data.result = Requester.validateResultNumber(response.data, ['price'])
    callback(response.status, Requester.success(jobRunID, response))
    client.ws.close()
  })

  const _getDataFromUrl = () => {
    const url = `https://api.tradingeconomics.com/markets/symbol/${symbol}`

    const params = {
      c: `${API_CLIENT_KEY}:${API_CLIENT_SECRET}`
    }

    const config = {
      url,
      params
    }

    const _handleResponse = response => {
      if (!response.data || response.data.length < 1) {
        return callback(500, Requester.errored(jobRunID, 'no result for query'))
      }
      // Replace array by the first object in array
      // to avoid unexpected behavior when returning arrays.
      response.data = response.data[0]

      response.data.result = Requester.validateResultNumber(response.data, ['Last'])
      callback(response.status, Requester.success(jobRunID, response))
    }

    const _handleError = error => callback(500, Requester.errored(jobRunID, error))

    Requester.request(config)
      .then(_handleResponse)
      .catch(_handleError)
  }

  // In case we don't get a response from the WS stream
  // within the WS_TIMEOUT, we do a check on the (possibly)
  // delayed HTTP(s) endpoint.
  const timeout = 1000
  const maxTries = wsTimeout / timeout
  let tries = 0
  const _checkTimeout = () => {
    if (completed) return

    if (tries++ > maxTries) {
      client.ws.close()
      _getDataFromUrl()
      return
    }

    setTimeout(_checkTimeout, timeout)
  }

  setTimeout(_checkTimeout, timeout)
}

module.exports.createRequest = createRequest
