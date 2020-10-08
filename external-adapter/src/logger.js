const { createLogger, format, transports } = require('winston')
const { combine, json, timestamp } = format

const detectLogger = (logger) => {
  // GCP Functions are special in that they need an extra transport
  // in order to log. The environment variable GCP_PROJECT should
  // always be present for any GCP Function.
  if (process.env.GCP_PROJECT) {
    const { LoggingWinston } = require('@google-cloud/logging-winston')
    logger.add(new LoggingWinston())
    logger.info('Added logging for GCP Functions')
  }
  return logger
}

const logger = detectLogger(
  createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp(), json()),
    transports: [new transports.Console()],
  }),
)

exports.logger = logger
