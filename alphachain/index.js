const bootstrap = require('@chainlink/ea-bootstrap')
const { createRequest } = require('./adapter')

module.exports = {
  server: bootstrap.server.init(createRequest),

  gcpservice: bootstrap.serverless.initGcpService(createRequest),
  handler: bootstrap.serverless.initHandler(createRequest),
  handlerv2: bootstrap.serverless.initHandlerV2(createRequest)
}
