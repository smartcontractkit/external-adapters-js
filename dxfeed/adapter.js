const { Requester, Validator } = require('@chainlink/external-adapter')
const username = process.env.API_USERNAME
const password = process.env.API_PASSWORD
const DEMO_ENDPOINT = 'https://tools.dxfeed.com/webservice/rest'
const apiEndpoint = process.env.API_ENDPOINT || DEMO_ENDPOINT

const customError = (data) => (data.status !== 'OK')

const customParams = {
  base: ['base', 'from', 'asset'],
  endpoint: false
}

const commonSymbols = {
  N225: 'N225:JP',
  FTSE: 'UKX:FTSE'
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'events.json'
  const url = `${apiEndpoint}/${endpoint}`
  let symbols = validator.validated.data.base.toUpperCase()
  if (symbols in commonSymbols) {
    symbols = commonSymbols[symbols]
  }

  const params = {
    events: 'Trade',
    symbols
  }

  const config = {
    url,
    params,
    auth: { username, password }
  }

  Requester.request(config, customError)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, ['Trade', symbols, 'price'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
