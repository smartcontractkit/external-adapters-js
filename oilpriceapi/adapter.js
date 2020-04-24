const { Requester, Validator } = require('external-adapter')

const commonKeys = {
  BZ: 'BRENT_CRUDE_USD'
}

const customParams = {
  base: ['type', 'base', 'asset', 'from'],
  endpoint: false
}

const customError = (body) => {
  return body.data === null
}

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams, callback)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'prices/latest'
  const url = `https://api.oilpriceapi.com/v1/${endpoint}`
  // eslint-disable-next-line camelcase
  let by_code = validator.validated.data.base.toUpperCase()
  if (commonKeys[by_code]) {
    // eslint-disable-next-line camelcase
    by_code = commonKeys[by_code]
  }

  const qs = {
    by_code
  }

  const headers = {
    Authorization: `Token ${process.env.API_KEY}`
  }

  const options = {
    url,
    qs,
    headers
  }

  Requester.requestRetry(options, customError)
    .then(response => {
      response.body.result = Requester.validateResult(response.body, ['data', 'price'])
      callback(response.statusCode, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
