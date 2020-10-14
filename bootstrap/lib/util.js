const { v4: uuidv4 } = require('uuid')

const parseBool = (value) => {
  if (!value) return false
  const _val = value.toString().toLowerCase()
  return (_val === 'true' || _val === 'false') && _val === 'true'
}

// We generate an UUID per instance
const uuid = () => {
  if (!process.env.UUID) process.env.UUID = uuidv4()
  return process.env.UUID
}

const toAsync = (execute, data) =>
  new Promise((resolve) => execute(data, (statusCode, data) => resolve({ statusCode, data })))

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Return a value used for exponential backoff in milliseconds.
 * @example
 * exponentialBackOffMs(1,100,1000,2) === 100
 * exponentialBackOffMs(2,100,1000,2) === 200
 * exponentialBackOffMs(3,100,1000,2) === 400
 *
 * @param retryCount The amount of retries that have passed
 * @param interval The interval in ms
 * @param max The maximum back-off in ms
 * @param coefficient The base multiplier
 */
const exponentialBackOffMs = (retryCount = 1, interval = 100, max = 1000, coefficient = 2) =>
  Math.min(max, interval * coefficient ** (retryCount - 1))

const getWithCoalescing = async ({ get, isInFlight, retries = 5, interval = () => 100 }) => {
  const _self = async (_retries) => {
    if (_retries === 0) return null
    const retryCount = retries - _retries + 1
    const entry = await get(retryCount)
    if (entry) return entry
    const inFlight = await isInFlight(retryCount)
    if (!inFlight) return null
    await delay(interval(retryCount))
    return await _self(_retries - 1)
  }
  return await _self(retries)
}

const getEnvName = (name, prefix = '') => {
  const envName = prefix ? `${prefix}_${name}` : name
  if (!isEnvNameValid(envName))
    throw Error(`Invalid environment var name: ${envName}. Only '/^[_a-z0-9]+$/i' is supported.`)
  return envName
}

// Only case-insensitive alphanumeric and underscore (_) are allowed for env vars
const isEnvNameValid = (name) => /^[_a-z0-9]+$/i.test(name)

const getEnv = (name, prefix = '') => process.env[getEnvName(name, prefix)]

// Custom error for required env variable.
class RequiredEnvError extends Error {
  constructor(name) {
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
const getRequiredEnv = (name, prefix = '') => {
  const val = getEnv(name, prefix)
  if (!val) throw new RequiredEnvError(getEnvName(name, prefix))
  return val
}

module.exports = {
  getEnv,
  getRequiredEnv,
  RequiredEnvError,
  parseBool,
  uuid,
  toAsync,
  delay,
  exponentialBackOffMs,
  getWithCoalescing,
}
