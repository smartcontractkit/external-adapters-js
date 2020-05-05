const { Requester, Validator } = require('external-adapter')

const commonKeys = {
  BZ: 'BRENT_CRUDE_USD'
}

const customParams = {
  base: ['type', 'base', 'asset', 'from'],
  endpoint: false
}

const customError = (data) => {
  return data.data === null
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'prices/latest'
  const url = `https://api.oilpriceapi.com/v1/${endpoint}`
  // eslint-disable-next-line camelcase
  let by_code = validator.validated.data.base.toUpperCase()
  if (commonKeys[by_code]) {
    // eslint-disable-next-line camelcase
    by_code = commonKeys[by_code]
  }

  const params = {
    by_code
  }

  const headers = {
    Authorization: `Token ${process.env.API_KEY}`
  }

  const config = {
    url,
    params,
    headers
  }

  Requester.request(config, customError)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, ['data', 'price'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
