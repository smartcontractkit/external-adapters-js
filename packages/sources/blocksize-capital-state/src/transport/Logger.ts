// import { makeLogger } from '@chainlink/external-adapter-framework/util'

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

interface Logger {
  debug(message: string, ...args: any[]): void
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}

export const createLogger = (name: string): Logger => {
  // Bypass framework logger and use console directly for colors
  const prefix = `[${name}]`

  return {
    debug(message: string, ...args: any[]) {
      if (shouldUseColors()) {
        console.debug(
          `${colors.gray}${prefix}[DEBUG]${colors.reset} ${colors.dim}${message}${colors.reset}`,
          ...args,
        )
      } else {
        console.debug(`${prefix}[DEBUG] ${message}`, ...args)
      }
    },

    info(message: string, ...args: any[]) {
      if (shouldUseColors()) {
        console.info(`${colors.cyan}${prefix}[INFO]${colors.reset} ${message}`, ...args)
      } else {
        console.info(`${prefix}[INFO] ${message}`, ...args)
      }
    },

    warn(message: string, ...args: any[]) {
      if (shouldUseColors()) {
        console.warn(`${colors.yellow}${prefix}[WARN] ${message}${colors.reset}`, ...args)
      } else {
        console.warn(`${prefix}[WARN] ${message}`, ...args)
      }
    },

    error(message: string, ...args: any[]) {
      if (shouldUseColors()) {
        console.error(`${colors.red}${prefix}[ERROR] ${message}${colors.reset}`, ...args)
      } else {
        console.error(`${prefix}[ERROR] ${message}`, ...args)
      }
    },
  }
}

const shouldUseColors = (): boolean => {
  if (process.env.NO_COLOR || process.env.DISABLE_COLORS) {
    return false
  }

  if (!process.stdout.isTTY) {
    return false
  }

  return true
}

export const createCustomLogger = (name: string): Logger => {
  return createLogger(name)
}
