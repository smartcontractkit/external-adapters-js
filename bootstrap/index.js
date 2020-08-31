const server = require('./lib/server')
const gcp = require('./lib/gcp')
const aws = require('./lib/aws')

const withStatusCode = (execute) => (data, callback) => {
  // Make sure data has the same statusCode as the one sent in callback
  const _callback = (statusCode, data) =>
    data && typeof data === 'object' && data.statusCode
      ? callback(statusCode, { ...data, statusCode })
      : callback(statusCode, data)
  return execute(data, _callback)
}

module.exports = {
  server: { init: (execute) => server.initHandler(withStatusCode(execute)) },
  serverless: {
    initGcpService: (execute) => gcp.initHandler(withStatusCode(execute)),
    initHandler: (execute) => aws.initHandlerREST(withStatusCode(execute)),
    initHandlerV2: (execute) => aws.initHandlerHTTP(withStatusCode(execute)),
  },
}
