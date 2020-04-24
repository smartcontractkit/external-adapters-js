const { Requester, Validator } = require('external-adapter')

const commonKeys = {
  N225: 'N225.INDX',
  FTSE: 'FTSE.INDX',
  BZ: 'BZ.COMM'
}

const customParams = {
  base: ['base', 'asset', 'from', 'symbol'],
  endpoint: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams, callback)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'real-time'
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const url = `https://eodhistoricaldata.com/api/${endpoint}/${symbol}`
  const api_token = process.env.API_KEY // eslint-disable-line camelcase

  const qs = {
    api_token,
    fmt: 'json'
  }

  const options = {
    url,
    qs
  }

  Requester.requestRetry(options)
    .then(response => {
      response.body.result = Requester.validateResult(response.body, ['close'])
      callback(response.statusCode, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
