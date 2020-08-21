const { Requester, Validator } = require('@chainlink/external-adapter')

const commonKeys = {
  N225: 'nk225',
}

const customParams = {
  base: ['base', 'from', 'asset'],
  endpoint: false,
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'get_real_data'
  const url = `https://indexes.nikkei.co.jp/en/nkave/${endpoint}`
  let idx = validator.validated.data.base.toUpperCase()

  if (idx in commonKeys) {
    idx = commonKeys[idx]
  }

  const params = {
    idx,
  }

  const config = {
    url,
    params,
  }

  Requester.request(config)
    .then((response) => {
      response.data.result = parseFloat(response.data.price.replace(',', ''))
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
