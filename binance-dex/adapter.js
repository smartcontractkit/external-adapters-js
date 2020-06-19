const { Requester, Validator } = require('@chainlink/external-adapter')
const apiEndpoint = process.env.API_ENDPOINT || 'dex-asiapacific'

const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  endpoint: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'v1/ticker/24hr'
  const url = `https://${apiEndpoint}.binance.org/api/${endpoint}`
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const symbol = `${base}_${quote}`

  const params = {
    symbol
  }

  const config = {
    url,
    params
  }

  Requester.request(config, customError)
    .then(response => {
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
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
