const { createLogger, format, transports } = require('winston')
const { combine, json, timestamp } = format

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [new transports.Console()]
})

exports.logger = logger
