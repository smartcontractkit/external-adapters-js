const { Requester, Validator } = require('@chainlink/external-adapter')

const commonKeys = {
  bz: 'BRENT_CRUDE_USD',
  brent: 'BRENT_CRUDE_USD',
}

const customParams = {
  base: ['type', 'base', 'asset', 'from', 'market'],
  endpoint: false,
}

const customError = (data) => {
  return data.data === null
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'prices/latest'
  const url = `https://api.oilpriceapi.com/v1/${endpoint}`
  // eslint-disable-next-line camelcase
  let by_code = validator.validated.data.base.toLowerCase()
  if (commonKeys[by_code]) {
    // eslint-disable-next-line camelcase
    by_code = commonKeys[by_code]
  }

  const params = {
    by_code,
  }

  const headers = {
    Authorization: `Token ${process.env.API_KEY}`,
  }

  const config = {
    url,
    params,
    headers,
  }

  Requester.request(config, customError)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, ['data', 'price'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
