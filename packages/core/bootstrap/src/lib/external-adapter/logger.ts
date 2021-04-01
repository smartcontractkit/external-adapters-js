import { v4 as uuidv4 } from 'uuid'
import { createLogger, format, transports } from 'winston'
const { combine, timestamp, json, prettyPrint } = format

// We generate an UUID per instance and add it to the logs
const uuid = () => {
  if (!process.env.UUID) process.env.UUID = uuidv4()
  return process.env.UUID
}

const instanceId = format((info) => {
  if (!info.instanceId) info.instanceId = uuid()
  return info
})

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format:
    process.env.NODE_ENV === 'development'
      ? combine(instanceId(), timestamp(), json(), prettyPrint())
      : combine(instanceId(), timestamp(), json()),
  transports: [new transports.Console()],
})
