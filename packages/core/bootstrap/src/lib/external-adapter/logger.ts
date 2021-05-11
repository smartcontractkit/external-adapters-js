import { uuid } from '../util'
import pino from 'pino'

export const loggerNew = pino({
  level: process.env.LOG_LEVEL || 'info',
  // timestamp: true, // default enabled
  prettyPrint: process.env.NODE_ENV === 'development',
  prettifier: require('pino-pretty'),
  formatters: {
    level(label) {
      return { level: label }
    },
  },
  hooks: {
    logMethod(inputArgs, method) {
      // flipping the order of inputs (switching from winston to pino)
      const length = inputArgs.length
      const arg1 = inputArgs.shift()
      if (length >= 2) {
        const arg2 = inputArgs.shift()

        // add instanceId if not present
        if (!arg2.instanceId) arg2.instanceId = uuid()

        return method.apply(this, [arg2, arg1, ...inputArgs])
      }
      return method.apply(this, [arg1, ...inputArgs])
    },
  },
})

export const logger = loggerNew
