const { Requester, Validator } = require('@chainlink/external-adapter')

const execute = (input, callback) => {
  const validator = new Validator(callback, input)
  const jobRunID = validator.validated.id
  const url = 'https://chainlink.orchid.com/0'

  const config = { url }

  Requester.request(config)
    .then(response => {
      const value = response.data
      response.data = { result: value }
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.createRequest = createRequest
