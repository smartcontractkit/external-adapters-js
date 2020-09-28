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

// Log adapter input & output data
const withLogger = (execute) => (data, callback) => {
  logger.debug('Input: ', { input: data })
  const _callback = (statusCode, data) => {
    logger.debug(`Output: [${statusCode}]: `, { output: data })
    callback(statusCode, data)
  }
  return execute(data, _callback)
}

// Log cache default options once
const cacheOptions = envOptions()
if (cacheOptions.enabled) logger.info('Cache enabled: ', cacheOptions)

// Execution helper async => sync
const _executeSync = (execute) => {
  // Add middleware
  const _execute = withLogger(withCache(withStatusCode(execute)))
  // Return sync function
  return (data, callback) => _execute(data, callback).then(() => {})
}

const expose = (execute, checkHealth) => {
  // Add middleware to the execution flow
  const _execute = _executeSync(execute)
  return {
    server: server.initHandler(_execute, checkHealth),
    gcpHandler: gcp.initHandler(_execute),
    // Default index.handler for AWS Lambda
    handler: aws.initHandlerREST(_execute),
    awsHandlerREST: aws.initHandlerREST(_execute),
    awsHandlerHTTP: aws.initHandlerHTTP(_execute),
  }
}

module.exports = { expose }
