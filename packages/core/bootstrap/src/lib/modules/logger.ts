import { uuid } from '../util'
import pino from 'pino'
import { cloneDeep } from 'lodash'
import { CensorList, CensorKeyValue, redactPaths } from '../config/logging'

const sensitiveKeys = [
  /cookie/i,
  /passw(or)?d/i,
  /^pw$/,
  /^pass$/i,
  /secret/i,
  /token/i,
  /api[-._]?key/i,
  /client/i,
]

export const censor = (v: string): string => {
  try {
    const url = new URL(v)
    url.searchParams.forEach((_, name) => {
      if (sensitiveKeys.some((rx) => rx.test(name))) {
        url.searchParams.set(name, 'REDACTED')
      }
    })
    return url.toString()
  } catch {
    // if not a URL
    return '[REDACTED]'
  }
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
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
      let argsList
      if (length >= 2) {
        const arg1 = inputArgs.shift()
        // if input includes message string + data object
        const arg2 = cloneDeep(inputArgs.shift())

        // add instanceId if not present
        if (typeof arg2 === 'object' && !arg2.instanceId) arg2.instanceId = uuid()

        argsList = [arg2, arg1, ...inputArgs]
      } else {
        argsList = inputArgs
      }
      return method.apply(
        this,
        argsList.map((arg) => censorLog(arg, CensorList.getAll())) as [string, ...unknown[]],
      )
    },
  },
  redact: {
    paths: redactPaths,
    censor,
  },
})

export function censorLog(obj: unknown, censorList: CensorKeyValue[]): unknown {
  let stringified = ''
  try {
    // JSON.stringify(obj) will fail if obj contains a circular reference.
    // If it fails, we fall back to replacing it with "[Unknown]".
    stringified = JSON.stringify(obj)
  } catch (e) {
    return '[Unknown]'
  }
  censorList.forEach((entry) => {
    stringified = stringified.replace(entry.value, `[${entry.key} REDACTED]`)
  })
  return JSON.parse(stringified)
}
