const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  if (Object.keys(data).length < 1) return true
  return false
}

const customParams = {
  speed: true,
  endpoint: false
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'ethgasAPI'
  const speed = validator.validated.data.speed
  const url = `https://ethgasstation.info/api/${endpoint}.json?api-key=${process.env.API_KEY}`

  Requester.request(url, customError)
    .then(response => {
      response.data.result = Requester.validateResultNumber(response.data, [speed]) * 1e8
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
