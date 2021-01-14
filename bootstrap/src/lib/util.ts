import {
  Execute,
  ExecuteSync,
  AdapterRequest,
  AdapterResponse,
  WrappedAdapterResponse,
  AdapterImplementation,
} from '@chainlink/types'
import { v4 as uuidv4 } from 'uuid'
import BN from 'bignumber.js'

export const isObject = (o: unknown): boolean =>
  o !== null && typeof o === 'object' && Array.isArray(o) === false

export const parseBool = (value: any): boolean => {
  if (!value) return false
  const _val = value.toString().toLowerCase()
  return (_val === 'true' || _val === 'false') && _val === 'true'
}

// convert string values into Numbers where possible (for incoming query strings)
export const toObjectWithNumbers = (obj: any) => {
  const toNumber = (v: any) => (isNaN(v) ? v : Number(v))
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toNumber(v)]))
}

// pick a random string from env var after splitting with the delimiter ("a&b&c" "&" -> choice(["a","b","c"]))
export const getRandomRequiredEnv = (name: string, delimiter = ',', prefix = '') => {
  const val = getRequiredEnv(name, prefix)
  const items = val.split(delimiter)
  return items[Math.floor(Math.random() * items.length)]
}

// We generate an UUID per instance
export const uuid = (): string => {
  if (!process.env.UUID) process.env.UUID = uuidv4()
  return process.env.UUID
}

export const toAsync = (
  execute: ExecuteSync,
  data: AdapterRequest,
): Promise<WrappedAdapterResponse> =>
  new Promise((resolve) =>
    execute(data, (statusCode: number, data: AdapterResponse) => resolve({ statusCode, data })),
  )

export const delay = (ms: number): Promise<number> =>
  new Promise((resolve) => setTimeout(resolve, ms))

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
export const exponentialBackOffMs = (retryCount = 1, interval = 100, max = 1000, coefficient = 2) =>
  Math.min(max, interval * coefficient ** (retryCount - 1))

export const getWithCoalescing = async ({
  get,
  isInFlight,
  retries = 5,
  interval = (retryCount) => 100,
}: {
  get: (retryCount: number) => unknown
  isInFlight: (retryCount: number) => unknown
  retries: number
  interval: (retryCount: number) => number
}) => {
  const _self = async (_retries: number): Promise<null | any> => {
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

// TODO: clean this ASAP
// @see WrappedAdapterResponse
export const wrapExecute = (execute: Execute) => async (
  request: AdapterRequest,
): Promise<WrappedAdapterResponse> => {
  const resp = await execute(request)
  return {
    statusCode: resp.statusCode,
    data: resp,
  }
}

/**
 * @description
 * Takes an Array<V>, and a grouping function,
 * and returns a Map of the array grouped by the grouping function.
 *
 * @param list An array of type V.
 * @param keyGetter A Function that takes the the Array type V as an input, and returns a value of type K.
 *                  K is generally intended to be a property key of V.
 *
 * @returns Map of the array grouped by the grouping function.
 */
export function groupBy<K, V>(list: Array<V>, keyGetter: (input: V) => K): Map<K, Array<V>> {
  const map = new Map<K, Array<V>>()
  list.forEach((item) => {
    const key = keyGetter(item)
    const collection = map.get(key)
    if (!collection) {
      map.set(key, [item])
    } else {
      collection.push(item)
    }
  })
  return map
}

/**
 * Predicate used to find adapter by name
 *
 * @param name string adapter name
 */
export const byName = (name?: string) => (a: AdapterImplementation): boolean =>
  a.NAME.toUpperCase() === name?.toUpperCase()

/**
 * Converts a given coin to different unit decimal places
 *
 * @param coin string of coin ticker name
 * @param amount string of a number value
 * @param unit optional string name of unit to convert to
 */
export const convertUnits = (coin: string, amount: string, unit?: string) => {
  switch (coin.toLowerCase()) {
    case 'btc':
      // default satoshi
      return new BN(amount).multipliedBy(10 ** 8).toString(10)
    default:
      return amount
  }
}
