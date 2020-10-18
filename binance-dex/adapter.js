const { Requester, Validator } = require('@chainlink/external-adapter')
const DEFAULT_API_ENDPOINT = 'dex-asiapacific'
const DEFAULT_DATA_ENDPOINT = 'v1/ticker/24hr'
const apiEndpoint = process.env.API_ENDPOINT || DEFAULT_API_ENDPOINT

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  endpoint: false,
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.errored)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_DATA_ENDPOINT
  const url = `https://${apiEndpoint}.binance.org/api/${endpoint}`
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const symbol = `${base}_${quote}`

  const _handleResponse = (response) => {
    if (response.data.length < 1) {
      return callback(500, Requester.errored(jobRunID, 'no result for query'))
    }

    // Replace array by the first object in array
    // to avoid unexpected behavior when returning arrays.
    response.data = response.data[0]

    const lastUpdate = response.data.closeTime
    const curTime = new Date()
    // If data is older than 10 minutes, discard it
    if (lastUpdate < curTime.setMinutes(curTime.getMinutes() - 10)) {
      return callback(500, Requester.errored(jobRunID, 'data is too old'))
    }

    response.data.result = Requester.validateResultNumber(response.data, ['lastPrice'])
    callback(response.status, Requester.success(jobRunID, response))
  }

  const _handleError = (error) => callback(500, Requester.errored(jobRunID, error))

  const params = {
    symbol,
  }

  const config = {
    url,
    params,
  }

  Requester.request(config).then(_handleResponse).catch(_handleError)
}

module.exports.execute = execute
