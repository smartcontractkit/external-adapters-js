const { Requester, Validator } = require('@chainlink/external-adapter')
const google = require('boxhock_google-finance-data')

const commonKeys = {
  N225: 'INDEXNIKKEI:NI225',
  FTSE: 'INDEXFTSE:UKX',
}

const customParams = {
  base: ['base', 'from', 'asset'],
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }

  google
    .getSymbol(symbol)
    .then((data) => {
      const status = 200
      const response = {
        data,
        status,
      }
      response.data.result = Requester.validateResultNumber(response.data, ['ticker'])
      callback(status, Requester.success(jobRunID, response))
    })
    .catch((err) => callback(500, Requester.errored(jobRunID, err.message)))
}

module.exports.execute = execute
