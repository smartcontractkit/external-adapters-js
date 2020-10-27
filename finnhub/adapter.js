const { Requester, Validator } = require('@chainlink/external-adapter')

const commonKeys = {
  N225: '^N225',
  FTSE: '^FTSE',
  XAU: 'OANDA:XAU_USD',
  XAG: 'OANDA:XAG_USD',
  AUD: 'OANDA:AUD_USD',
  EUR: 'OANDA:EUR_USD',
  GBP: 'OANDA:GBP_USD',
  // CHF & JPY are not supported
}

const customParams = {
  base: ['base', 'asset', 'from'],
  endpoint: false,
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'quote'
  const url = `https://finnhub.io/api/v1/${endpoint}`
  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const token = process.env.API_KEY

  const params = {
    symbol,
    token,
  }

  const config = {
    url,
    params,
  }

  Requester.request(config)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, ['c'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
