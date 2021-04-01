import { AdapterRequest } from '@chainlink/types'
import { logger } from './logger'
import { Validator } from './validator'

// pick a random string from env var after splitting with the delimiter ("a&b&c" "&" -> choice(["a","b","c"]))
export const getRandomEnv = (name: string, delimiter = ',', prefix = '') => {
  const val = getEnv(name, prefix)
  if (!val) return val
  const items = val.split(delimiter)
  return items[Math.floor(Math.random() * items.length)]
}

// pick a random string from env var after splitting with the delimiter ("a&b&c" "&" -> choice(["a","b","c"]))
export const getRandomRequiredEnv = (name: string, delimiter = ',', prefix = '') => {
  const val = getRequiredEnv(name, prefix)
  const items = val.split(delimiter)
  return items[Math.floor(Math.random() * items.length)]
}

const getEnvName = (name: string, prefix = '') => {
  const envName = prefix ? `${prefix}_${name}` : name
  if (!isEnvNameValid(envName))
    throw Error(`Invalid environment var name: ${envName}. Only '/^[_a-z0-9]+$/i' is supported.`)
  return envName
}

// Only case-insensitive alphanumeric and underscore (_) are allowed for env vars
const isEnvNameValid = (name: string) => /^[_a-z0-9]+$/i.test(name)

export const getEnv = (name: string, prefix = ''): string | undefined =>
  process.env[getEnvName(name, prefix)]

// Custom error for required env variable.
export class RequiredEnvError extends Error {
  constructor(name: string) {
    super(`Please set the required env ${name}.`)
    this.name = RequiredEnvError.name
  }
}

/**
 * Get variable from environments
 * @param name The name of environment variable
 * @throws {RequiredEnvError} Will throw an error if environment variable is not defined.
 * @returns {string}
 */
export const getRequiredEnv = (name: string, prefix = ''): string => {
  const val = getEnv(name, prefix)
  if (!val) throw new RequiredEnvError(getEnvName(name, prefix))
  return val
}
