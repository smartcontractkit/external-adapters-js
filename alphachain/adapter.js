const { Requester, Validator } = require('@chainlink/external-adapter')

const customError = (data) => {
  if (data.status !== '200') return true
  return false
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

const execute = (input, callback) => {
  const validator = new Validator(input, customParams)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  const url = 'https://alpha-chain2.p.rapidapi.com/data-query'
  const host = 'alpha-chain2.p.rapidapi.com'
  const headers = {
    'content-type': 'application/octet-stream',
    'x-rapidapi-host': host,
    'x-rapidapi-key': process.env.API_KEY,
    useQueryString: true,
  }
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()

  const params = {
    from_symbol: base,
    to_symbol: quote,
    chainlink_node: true,
  }

  const config = {
    url,
    params,
    headers,
  }

  Requester.request(config, customError)
    .then((response) => {
      response.data.result = Requester.validateResultNumber(response.data, ['result'])
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => callback(500, Requester.errored(jobRunID, error)))
}

module.exports.execute = execute
