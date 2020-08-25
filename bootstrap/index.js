const { logger } = require('@chainlink/external-adapter')
const server = require('./lib/server')
const gcp = require('./lib/gcp')
const aws = require('./lib/aws')
const { withCache, envOptions } = require('./lib/cache')

const withStatusCode = (execute) => (data, callback) => {
  // Make sure data has the same statusCode as the one sent in callback
  const _callback = (statusCode, data) =>
    data && typeof data === 'object' && data.statusCode
      ? callback(statusCode, { ...data, statusCode })
      : callback(statusCode, data)
  return execute(data, _callback)
}

// Log cache default options once
const cacheOptions = envOptions()
if (cacheOptions.enabled) logger.info('Cache enabled: ', cacheOptions)

const expose = (execute, checkHealth) => ({
  server: server.initHandler(withCache(withStatusCode(execute, checkHealth))),
  gcpHandler: gcp.initHandler(withCache(withStatusCode(execute))),
  // Default index.handler for AWS Lambda
  handler: aws.initHandlerREST(withCache(withStatusCode(execute))),
  awsHandlerREST: aws.initHandlerREST(withCache(withStatusCode(execute))),
  awsHandlerHTTP: aws.initHandlerHTTP(withCache(withStatusCode(execute))),
})

module.exports = { expose }
