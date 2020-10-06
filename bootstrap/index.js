const { Requester, logger } = require('@chainlink/external-adapter')
const { withCache, envOptions } = require('./lib/cache')
const { toAsync } = require('./lib/util')
const server = require('./lib/server')
const gcp = require('./lib/gcp')
const aws = require('./lib/aws')

const skipOnError = (middleware) => async (execute) => {
  // Try to execute, pass through on error
  const _safe = (executeWithMiddleware) => async (data) => {
    try {
      return await executeWithMiddleware(data)
    } catch (error) {
      logger.warn(`${middleware.name} middleware execution error! Passing through. `, error)
      return execute(data)
    }
  }

  // Try to initialize, pass through on error
  try {
    return _safe(await middleware(execute))
  } catch (error) {
    logger.warn(`${middleware.name} middleware initialization error! Passing through. `, error)
    return execute
  }
}

// Transform sync execute function to async
const withAsync = (execute) => async (data) => toAsync(execute, data)

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

const middleware = [withAsync, skipOnError(withCache), withStatusCode]

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
      .catch((error) => callback(500, Requester.errored(data.id, error)))
  }
}

// Log cache default options once
const cacheOptions = envOptions()
if (cacheOptions.enabled) logger.info('Cache enabled: ', cacheOptions)

module.exports = {
  server: { init: (execute) => server.initHandler(executeSync(execute)) },
  serverless: {
    initGcpService: (execute) => gcp.initHandler(executeSync(execute)),
    initHandler: (execute) => aws.initHandlerREST(executeSync(execute)),
    initHandlerV2: (execute) => aws.initHandlerHTTP(executeSync(execute)),
  },
}
