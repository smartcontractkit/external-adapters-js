const { Requester, Validator } = require('@chainlink/external-adapter')
const cryptoVolatilityIndex = require('./src/cryptoVolatilityIndex.js')

const bootstrap = () => {
  console.log('Bootstrapping CVX calculation')
  cryptoVolatilityIndex.scheduleCron()
}

const execute = (input, callback) => {
  const validator = new Validator(input)
  if (validator.error) return callback(validator.error.statusCode, validator.error)

  const jobRunID = validator.validated.id
  console.log('jobRunID:', jobRunID)

  cryptoVolatilityIndex
    .calculate()
    .then((result) => {
      const response = {
        status: 200,
        data: {
          result,
        },
      }
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch((error) => {
      console.error(error)
      callback(500, Requester.errored(jobRunID, error))
    })
}

module.exports.execute = execute
module.exports.bootstrap = bootstrap
