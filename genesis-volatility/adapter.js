const { Requester, Validator } = require('@chainlink/external-adapter')

const API_KEY = process.env.API_KEY

const customParams = {
  symbol: ['base', 'from', 'coin', 'symbol'],
  key: ['key', 'result', 'period']
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const url = 'https://app.pinkswantrading.com/graphql'
  const symbol = validator.validated.data.symbol.toUpperCase()
  const key = validator.validated.data.key

  const data = {
    query: 'query ChainlinkIv($symbol: SymbolEnumType){ChainlinkIv(symbol: $symbol){oneDayIv twoDayIv sevenDayIv fourteenDayIv twentyOneDayIv twentyEightDayIv}}',
    variables: { symbol }
  }

  const headers = {
    'x-oracle': API_KEY,
    'Content-Type': 'application/json',
    accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9'
  }

  const config = {
    url,
    method: 'get',
    headers,
    data
  }

  Requester.request(config)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, ['data', 'ChainlinkIv', 0, key])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
