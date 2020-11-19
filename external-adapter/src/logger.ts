import { createLogger, format, Logger, transports } from 'winston'
const { combine, timestamp, json, prettyPrint } = format
import { v4 as uuidv4 } from 'uuid'

const detectLogger = (logger: Logger) => {
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

// We generate an UUID per instance and add it to the logs
const uuid = () => {
  if (!process.env.UUID) process.env.UUID = uuidv4()
  return process.env.UUID
}

const instanceId = format((info) => {
  if (!info.instanceId) info.instanceId = uuid()
  return info
})

export const logger = detectLogger(
  createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format:
      process.env.NODE_ENV === 'development'
        ? combine(instanceId(), timestamp(), json(), prettyPrint())
        : combine(instanceId(), timestamp(), json()),
    transports: [new transports.Console()],
  }),
)
