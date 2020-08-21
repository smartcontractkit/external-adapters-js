const { Requester, Validator } = require('@chainlink/external-adapter')
const yahooFinance = require('yahoo-finance')

const commonKeys = {
  N225: '^N225',
  FTSE: '^FTSE',
  BZ: 'BZ=F',
  AUD: 'AUDUSD=X',
  CHF: 'CHFUSD=X',
  EUR: 'EURUSD=X',
  GBP: 'GBPUSD=X',
  JPY: 'JPYUSD=X',
}

const customParams = {
  base: ['base', 'from', 'asset'],
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }

  yahooFinance.quote(
    {
      symbol: symbol,
      modules: ['price'],
    },
    (err, data) => {
      if (err) {
        callback(500, Requester.errored(jobRunID, err.message))
      } else {
        const statusCode = 200
        const response = {
          data,
          statusCode,
        }
        response.data.result = Requester.validateResultNumber(response.data, [
          'price',
          'regularMarketPrice',
        ])
        callback(statusCode, Requester.success(jobRunID, response))
      }
    },
  )
}

module.exports.execute = execute
