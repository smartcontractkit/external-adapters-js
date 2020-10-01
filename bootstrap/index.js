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
const withLogger = (execute) => async (data) => {
  logger.debug('Input: ', { input: data })
  const result = await execute(data)
  logger.debug(`Output: [${result.statusCode}]: `, { output: result.data })
  return result
}

// Log cache default options once
const cacheOptions = envOptions()
if (cacheOptions.enabled) logger.info('Cache enabled: ', cacheOptions)

const withMiddleware = async (execute) => withLogger(withCache(withStatusCode(execute)))

// Execution helper async => sync
const executeSync = (execute) => {
  let _execute
  // Return sync function
  return (data, callback) => {
    // Init middleware only once
    const init = _execute
      ? Promise.resolve(_execute)
      : withMiddleware(execute).then((fn) => {
          _execute = fn
          return _execute
        })

    return init
      .then((executeWithMiddleware) => executeWithMiddleware(data))
      .then((result) => callback(result.statusCode, result.data))
  }
}

const expose = (execute, checkHealth) => {
  // Add middleware to the execution flow
  const _execute = executeSync(execute)
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
