const { Requester, logger } = require('@chainlink/external-adapter')
const server = require('./lib/server')
const gcp = require('./lib/gcp')
const aws = require('./lib/aws')
const { withCache, envOptions } = require('./lib/cache')
const { toAsync } = require('./lib/util')

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
const withAsync = (execute) => async (data) => toAsync(execute, data)

let executeWithMiddleware
const middleware = [withAsync, withLogger, withCache, withStatusCode]

// Init all middleware, and return a wrapped execute fn
const withMiddleware = async (execute) => {
  // Init middleware only once
  if (executeWithMiddleware) return executeWithMiddleware
  // Init and wrap middleware one by one
  for (let i = 0; i < middleware.length; i++) {
    execute = await middleware[i](execute)
  }
  return (executeWithMiddleware = execute)
}

// Execution helper async => sync
const executeSync = (execute) => {
  // Return sync function
  return (data, callback) => {
    return withMiddleware(execute)
      .then((executeWithMiddleware) => executeWithMiddleware(data))
      .then((result) => callback(result.statusCode, result.data))
      .catch((error) => callback(500, Requester.errored(data.id, error)))
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

// Log cache default options once
const cacheOptions = envOptions()
if (cacheOptions.enabled) logger.info('Cache enabled: ', cacheOptions)

module.exports = { expose }
