const { Requester, Validator } = require('@chainlink/external-adapter')

const commonKeys = {
  N225: 'N225.INDX',
  FTSE: 'FTSE.INDX',
  BZ: 'BZ.COMM',
}

const customParams = {
  base: ['base', 'asset', 'from', 'symbol'],
  endpoint: false,
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'real-time'
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const url = `https://eodhistoricaldata.com/api/${endpoint}/${symbol}`
  const api_token = process.env.API_KEY // eslint-disable-line camelcase

  const params = {
    api_token,
    fmt: 'json',
  }

  const config = {
    url,
    params,
  }

  Requester.request(config)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, [
        'close',
      ])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
