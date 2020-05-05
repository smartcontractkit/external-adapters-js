const { Requester, Validator } = require('external-adapter')
const google = require('boxhock_google-finance-data')

const commonKeys = {
  N225: 'INDEXNIKKEI:NI225',
  FTSE: 'INDEXFTSE:UKX'
}

const customParams = {
  base: ['base', 'from', 'asset']
}

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams, callback)
  const jobRunID = validator.validated.id
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }

  google.getSymbol(symbol).then(body => {
    const statusCode = 200
    const response = {
      body,
      statusCode
    }
    response.body.result = Requester.validateResult(response.body, ['ticker'])
    callback(statusCode, Requester.success(jobRunID, response))
  }).catch(err => {
    callback(500, Requester.errored(jobRunID, err.message))
  })
}

module.exports.createRequest = createRequest
