const { Requester, Validator } = require('@chainlink/external-adapter')

const ENDPOINT_COUNTRY = 'country'

const DEFAULT_ENDPOINT = ENDPOINT_COUNTRY

const countryParams = {
  location: ['location'],
  field: ['field'],
  date: false,
}

const validDate = (date) => {
  if (date) {
    if (isNaN(Number(date))) return false
    if (date.length != 8) return false
  }
  return true
}

const findDay = (payload, date) => {
  if (!date) return payload[0]
  // All historical dates are given, find the the correct one
  for (const index in payload) {
    if (payload[index].date === Number(date)) {
      return payload[index]
    }
    // Response body is sorted by descending data. If we see an earlier date we know our result doesn't exist.
    if (payload[index].date < Number(date)) {
      return null
    }
  }
  return null
}

const country = (jobRunID, input, callback) => {
  const validator = new Validator(input, countryParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const field = validator.validated.data.field
  const date = validator.validated.data.date
  if (!validDate(date)) return callback(400, Requester.errored(jobRunID, 'Invalid date format'))

  const suffix = date ? 'daily' : 'current'
  const url = `https://api.covidtracking.com/v1/us/${suffix}.json`
  const config = { url }

  const _handleResponse = (response) => {
    response.data = findDay(response.data, date)
    if (!response.data) return callback(400, Requester.errored(jobRunID, 'Date not found'))
    response.data.result = Requester.validateResultNumber(response.data, [`${field}`])
    callback(response.status, Requester.success(jobRunID, response))
  }

  const _handleError = (error) => callback(500, Requester.errored(jobRunID, error))

  Requester.request(config).then(_handleResponse).catch(_handleError)
}

const customParams = {
  endpoint: false,
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  switch (endpoint.toLowerCase()) {
    case ENDPOINT_COUNTRY:
      return country(jobRunID, input, callback)
    default:
      callback(500, Requester.errored(jobRunID, 'invalid endpoint provided'))
  }
}

module.exports.execute = execute
