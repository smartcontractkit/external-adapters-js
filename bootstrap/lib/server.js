const { logger } = require('@chainlink/external-adapter')
const express = require('express')
const {
  HTTP_ERROR_NOT_IMPLEMENTED,
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE,
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE,
} = require('./errors')

const app = express()
const port = process.env.EA_PORT || 8080

const HEADER_CONTENT_TYPE = 'Content-Type'
const CONTENT_TYPE_APPLICATION_JSON = 'application/json'
const CONTENT_TYPE_TEXT_PLAIN = 'text/plain'

const notImplementedHealthCheck = (callback) => callback(HTTP_ERROR_NOT_IMPLEMENTED)

const initHandler = (execute, checkHealth = notImplementedHealthCheck) => () => {
  app.use(express.json())

  app.post('/', (req, res) => {
    logger.debug('POST Data: ', { input: req.body })

    if (!req.is(CONTENT_TYPE_APPLICATION_JSON)) {
      return res
        .status(HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE)
        .send(HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE)
    }

    execute(req.body, (status, result) => {
      logger.debug(`Result: [${status}]: `, { output: result })
      res.status(status).json(result)
    })
  })

  app.get('/health', (_, res) => {
    logger.debug('Health check request')
    checkHealth((status, result) => {
      logger.debug(`Health check result [${status}]: `, { output: result })
      res.status(status).json(result)
    })
  })

  app.listen(port, () => logger.info(`Listening on port ${port}!`))

  process.on('SIGINT', () => {
    process.exit()
  })
}

module.exports = {
  initHandler,
  HEADER_CONTENT_TYPE,
  CONTENT_TYPE_APPLICATION_JSON,
  CONTENT_TYPE_TEXT_PLAIN,
}
