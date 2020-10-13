const { Requester, Validator } = require('@chainlink/external-adapter')

const customParams = {
  symbol: ['base', 'from', 'coin', 'sym', 'symbol'],
  convert: ['quote', 'to', 'market', 'convert'],
  cid: false,
}

const currencyPairToken = ':currency_pair'
const baseUrl = `https://api.coinbase.com/v2/prices/${currencyPairToken}/spot`

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol
  const convert = validator.validated.data.convert
  const currencyPair = `${symbol}-${convert}`.toUpperCase()
  const url = baseUrl.replace(currencyPairToken, currencyPair)
  const params = {
    symbol,
    convert,
  }
  const config = {
    url,
    params,
  }
  Requester.request(config)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, ['data', 'amount'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
