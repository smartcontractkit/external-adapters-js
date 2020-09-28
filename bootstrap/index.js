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

// Execution helper async => sync
const _executeSync = (execute) => {
  // Add middleware
  const _execute = withCache(withStatusCode(execute))
  // Return sync function
  return (data, callback) => _execute(data, callback).then(() => {})
}

module.exports = {
  server: { init: (execute) => server.initHandler(_executeSync(execute)) },
  serverless: {
    initGcpService: (execute) => gcp.initHandler(_executeSync(execute)),
    initHandler: (execute) => aws.initHandlerREST(_executeSync(execute)),
    initHandlerV2: (execute) => aws.initHandlerHTTP(_executeSync(execute)),
  },
}
