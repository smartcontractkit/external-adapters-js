const { Requester, logger } = require('@chainlink/external-adapter')
const { types } = require('util')
const { withCache, envOptions } = require('./lib/cache')
const util = require('./lib/util')
const server = require('./lib/server')
const gcp = require('./lib/gcp')
const aws = require('./lib/aws')

// Try to initialize, pass through on error
const skipOnError = (middleware) => async (execute) => {
  try {
    return await middleware(execute)
  } catch (error) {
    logger.warn(`${middleware.name} middleware initialization error! Passing through. `, error)
    return execute
  }
}

// Make sure data has the same statusCode as the one we got as a result
const withStatusCode = (execute) => async (data_) => {
  const { statusCode, data } = await execute(data_)
  if (data && typeof data === 'object' && data.statusCode) {
    return {
      statusCode,
      data: {
        ...data,
        statusCode,
      },
    }
  }

  return { statusCode, data }
}

// Log adapter input & output data
const withLogger = (execute) => async (data) => {
  logger.debug('Input: ', { input: data })
  const result = await execute(data)
  logger.debug(`Output: [${result.statusCode}]: `, { output: result.data })
  return result
}

// Transform sync execute function to async
const withAsync = (execute) => {
  // Check if execute is already a Promise
  if (types.isAsyncFunction(execute)) return (data) => execute(data)
  return async (data) => util.toAsync(execute, data)
}

const middleware = [withAsync, withLogger, skipOnError(withCache), withStatusCode]

// Init all middleware, and return a wrapped execute fn
const withMiddleware = async (execute) => {
  // Init and wrap middleware one by one
  for (let i = 0; i < middleware.length; i++) {
    execute = await middleware[i](execute)
  }
  return execute
}

// Execution helper async => sync
const executeSync = (execute) => {
  // TODO: Try to init middleware only once
  // const initMiddleware = withMiddleware(execute)

  // Return sync function
  return (data, callback) => {
    // We init on every call because of cache connection broken state issue
    return withMiddleware(execute)
      .then((executeWithMiddleware) => executeWithMiddleware(data))
      .then((result) => callback(result.statusCode, result.data))
      .catch((error) => callback(error.statusCode || 500, Requester.errored(data.id, error)))
  }
}

const expose = (execute, checkHealth) => {
  // Add middleware to the execution flow
  const _execute = executeSync(execute)
  return {
    server: server.initHandler(_execute, checkHealth),
    gcpHandler: gcp.initHandler(_execute),
    // Backwards compatibility for old gcpHandler
    gcpservice: gcp.initHandler(_execute),
    // Default index.handler for AWS Lambda
    handler: aws.initHandlerREST(_execute),
    awsHandlerREST: aws.initHandlerREST(_execute),
    awsHandlerHTTP: aws.initHandlerHTTP(_execute),
  }
}

// Log cache default options once
const cacheOptions = envOptions()
if (cacheOptions.enabled) logger.info('Cache enabled: ', cacheOptions)

module.exports = { expose, util }
