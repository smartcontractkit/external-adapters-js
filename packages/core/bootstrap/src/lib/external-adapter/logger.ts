import { createLogger, format, transports } from 'winston'
import { uuid, redact } from '../util'
const { combine, timestamp, json, prettyPrint } = format

const instanceId = format(info => {
  if (!info.instanceId) info.instanceId = uuid()
  return info
})

// https://github.com/winstonjs/winston/issues/1079#issuecomment-729050088
const redactData = format(info => {
  const result = redact(info)

  const levelSym = Symbol.for('level')
  const splatSym = Symbol.for('splat')

  result[levelSym] = info[(levelSym as unknown) as string]
  result[splatSym] = info[(splatSym as unknown) as string]

  return result
})

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format:
    process.env.NODE_ENV === 'development'
      ? combine(instanceId(), timestamp(), redactData(), json(), prettyPrint())
      : combine(instanceId(), timestamp(), redactData(), json()),
  transports: [new transports.Console()],
})
