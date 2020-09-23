const { logger } = require('@chainlink/external-adapter')
const { CONTENT_TYPE_APPLICATION_JSON, CONTENT_TYPE_TEXT_PLAIN } = require('./server')
const {
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE,
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE,
} = require('./errors')

exports.initHandler = (execute) => (req, res) => {
  logger.debug('POST Data: ', { input: req.body })

  if (!req.is(CONTENT_TYPE_APPLICATION_JSON)) {
    return res
      .type(CONTENT_TYPE_TEXT_PLAIN)
      .status(HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE)
      .send(HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE)
  }

  execute(req.body, (statusCode, data) => {
    logger.debug(`Result: [${statusCode}]: `, { output: data })
    res.type('json').status(statusCode).send(data)
  })
}
