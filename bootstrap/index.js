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

const withMiddleware = async (execute) => {
  return await withCache(withStatusCode(execute))
}

// Execution helper async => sync
const executeSync = (execute) => {
  let _execute = undefined
  // Return sync function
  return (data, callback) => {
    // Init middleware only once
    const init = _execute
      ? Promise.resolve(_execute)
      : withMiddleware(execute).then((fn) => {
          _execute = fn
          return _execute
        })

    return init.then((fn) => fn(data)).then((result) => callback(result.statusCode, result.data))
  }
}

module.exports = {
  server: { init: (execute) => server.initHandler(executeSync(execute)) },
  serverless: {
    initGcpService: (execute) => gcp.initHandler(executeSync(execute)),
    initHandler: (execute) => aws.initHandlerREST(executeSync(execute)),
    initHandlerV2: (execute) => aws.initHandlerHTTP(executeSync(execute)),
  },
}
