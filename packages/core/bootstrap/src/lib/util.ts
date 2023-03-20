import type {
  AdapterContext,
  AdapterImplementation,
  BasePairInputParameters,
  PairOptionsMap,
  EnvDefaults,
  IncludePair,
} from '../types'
import type { Validator } from './modules/validator'
import { FastifyRequest } from 'fastify'
import type { CacheEntry } from './middleware/cache/types'
import { Decimal } from 'decimal.js'
import { flatMap, values, List } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { logger } from './modules/logger'
import { AdapterConfigError, AdapterError, RequiredEnvError } from './modules/error'
import { CensorList, CensorKeyValue, configRedactEnvVars } from './config/logging'

export const isString = (value: unknown): boolean =>
  typeof value === 'string' || value instanceof String

export const isNumber = (value: unknown): boolean => typeof value === 'number'

/**
 * Used in the `getEnv` util function as a backup when an env var
 * is `empty` or `undefined`, and no `envDefaultOverride` is given.
 */
export const baseEnvDefaults: EnvDefaults = {
  BASE_URL: '/',
  EA_PORT: '8080',
  EA_HOST: '::',
  METRICS_PORT: '9080',
  METRICS_ENABLED: 'true',
  RETRY: '1',
  API_TIMEOUT: '10000',
  CACHE_ENABLED: 'true',
  CACHE_TYPE: 'local',
  CACHE_MAX_AGE: '90000', // 1.5 minutes
  CACHE_MIN_AGE: '30000',
  CACHE_MAX_ITEMS: '1000',
  CACHE_UPDATE_AGE_ON_GET: 'false',
  CACHE_REDIS_CONNECTION_TIMEOUT: '15000', // Timeout per long lived connection (ms)
  CACHE_REDIS_HOST: '127.0.0.1', // IP address of the Redis server
  CACHE_REDIS_MAX_QUEUED_ITEMS: '3000', // Maximum length of the client's internal command queue
  CACHE_REDIS_MAX_RECONNECT_COOLDOWN: '3000', // Max cooldown time before attempting to reconnect (ms)
  CACHE_REDIS_PORT: '6379', // Port of the Redis server
  CACHE_REDIS_TIMEOUT: '1000', // Timeout per request (ms)
  MAX_PAYLOAD_SIZE_LIMIT: '1048576', // Default to Fastify server default of 1MB (bytes)
  RATE_LIMIT_ENABLED: 'true',
  WARMUP_ENABLED: 'true',
  WARMUP_UNHEALTHY_THRESHOLD: '3',
  WARMUP_SUBSCRIPTION_TTL: '3600000', // default 1h
  REQUEST_COALESCING_INTERVAL: '100',
  REQUEST_COALESCING_INTERVAL_MAX: '1000',
  REQUEST_COALESCING_INTERVAL_COEFFICIENT: '2',
  REQUEST_COALESCING_ENTROPY_MAX: '0',
  REQUEST_COALESCING_MAX_RETRIES: '5',
  WS_ENABLED: 'false',
  WS_CONNECTION_KEY: '1',
  WS_CONNECTION_LIMIT: '1',
  WS_CONNECTION_TTL: '70000',
  WS_CONNECTION_RETRY_LIMIT: '3',
  WS_CONNECTION_RETRY_DELAY: '1000',
  WS_SUBSCRIPTION_LIMIT: '10',
  WS_SUBSCRIPTION_TTL: '120000',
  WS_SUBSCRIPTION_UNRESPONSIVE_TTL: '120000',
  DEFAULT_WS_HEARTBEAT_INTERVAL: '30000',
}

export const isObject = (o: unknown): boolean =>
  o !== null && typeof o === 'object' && Array.isArray(o) === false

export const isArray = (o: unknown): boolean =>
  o !== null && typeof o === 'object' && Array.isArray(o)

export const parseBool = (value: unknown): boolean => {
  if (value === true) return true
  if (!value) return false
  if (!isString(value) && !isNumber(value)) return false

  const str = `${value}`.toUpperCase().trim()
  return !['FALSE', 'NO', '0'].includes(str)
}

// convert string values into Numbers where possible (for incoming query strings)
export const toObjectWithNumbers = (obj: Record<string, unknown>): Record<string, unknown> => {
  const toNumber = (v: unknown) => (isNaN(Number(v)) ? v : Number(v))
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toNumber(v)]))
}

// pick a random string from env var after splitting with the delimiter ("a&b&c" "&" -> choice(["a","b","c"]))
export const getRandomEnv = (name: string, delimiter = ',', prefix = ''): string | undefined => {
  const val = getEnv(name, prefix)
  if (!val) return val
  const items = val.split(delimiter)
  return items[Math.floor(Math.random() * items.length)]
}

// pick a random string from env var after splitting with the delimiter ("a&b&c" "&" -> choice(["a","b","c"]))
export const getRandomRequiredEnv = (
  name: string,
  delimiter = ',',
  prefix = '',
): string | undefined => {
  const val = getRequiredEnv(name, prefix)
  const items = val.split(delimiter)
  return items[Math.floor(Math.random() * items.length)]
}

// We generate an UUID per instance
export const uuid = (): string => uuidv4()

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
export const exponentialBackOffMs = (
  retryCount = 1,
  interval = 100,
  max = 1000,
  coefficient = 2,
): number => Math.min(max, interval * coefficient ** (retryCount - 1))

export const getWithCoalescing = async ({
  get,
  isInFlight,
  retries = 5,
  interval = () => 100,
}: {
  get: (retryCount: number) => Promise<CacheEntry | undefined>
  isInFlight: (retryCount: number) => Promise<boolean>
  retries: number
  interval: (retryCount: number) => number
}): Promise<CacheEntry | undefined> => {
  const _self = async (_retries: number): Promise<undefined | CacheEntry> => {
    if (_retries === 0) return
    const retryCount = retries - _retries + 1
    const entry = await get(retryCount)
    if (entry) return entry
    const inFlight = await isInFlight(retryCount)
    if (!inFlight) return
    await sleep(interval(retryCount))
    return await _self(_retries - 1)
  }
  return await _self(retries)
}

export const logError = (error: AdapterError): AdapterError => {
  logger.error({ feedId: error.feedID, type: error.metricsLabel, message: error.message })
  return error
}

const getEnvName = (name: string, prefix = '') => {
  const envName = prefix ? `${prefix}_${name}` : name
  if (!isEnvNameValid(envName))
    throw logError(
      new AdapterConfigError({
        message: `Invalid environment var name: ${envName}. Only '/^[_a-z0-9]+$/i' is supported.`,
      }),
    )
  return envName
}

// Only case-insensitive alphanumeric and underscore (_) are allowed for env vars
const isEnvNameValid = (name: string) => /^[_a-z0-9]+$/i.test(name)

/**
 * Get the env var with the given `name`. If the variable is
 * not present in `process.env`, it will default to the adapter's
 * `envDefaultOverrides` if adapter's `context` is present, then
 * `baseEnvDefaults`. In order for `envDefaultOverrides` to override the
 * base default, the adapter's `context` must be passed into `getEnv`
 * everywhere that the variable is fetched. See `WS_ENABLED` as an example.
 * @param name Env var to fetch
 * @param prefix Prefix for env var (useful when working with composites)
 * @param context Adapter context to pull `envDefaultOverrides` from
 * @returns the env var string if found, else undefined
 */
export const getEnv = (name: string, prefix = '', context?: AdapterContext): string | undefined => {
  let envVar = process.env[getEnvName(name, prefix)]
  if (!envVar || envVar === '' || envVar === '""') {
    //@ts-expect-error EnvDefaultOverrides only allows specific string keys, but optional chaining
    // protects against cases where 'name' is not in EnvDefaultOverrides
    envVar = context?.envDefaultOverrides?.[name] ?? baseEnvDefaults[name]
  }
  if (envVar === '' || envVar === '""') envVar = undefined
  return envVar
}

/**
 * Get variable from environments
 * @param name The name of environment variable
 * @param prefix A string to add before the environment variable name
 * @throws {RequiredEnvError} Will throw an error if environment variable is not defined.
 * @returns {string}
 */
export const getRequiredEnv = (name: string, prefix = ''): string => {
  const val = getEnv(name, prefix)
  if (!val) {
    throw logError(new RequiredEnvError(getEnvName(name, prefix)))
  }
  return val
}

// format input as an array regardless of if it is a string or an array already
export const formatArray = (input: string | string[]): string[] =>
  typeof input === 'string' ? [input] : input

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
export const byName =
  (name?: string) =>
  (a: AdapterImplementation): boolean =>
    a.NAME.toUpperCase() === name?.toUpperCase()

/**
 * Covert number to max number of decimals, trim trailing zeros
 *
 * @param num number to convert to fixed max number of decimals
 * @param decimals max number of decimals
 */
export const toFixedMax = (num: number | string | Decimal, decimals: number): string =>
  new Decimal(num)
    .toFixed(decimals)
    // remove trailing zeros
    .replace(/(\.\d*?[1-9])0+$/g, '$1')
    // remove decimal part if all zeros (or only decimal point)
    .replace(/\.0*$/g, '')

// Helper to identify if debug mode is running
export const isDebug = (): boolean => {
  return parseBool(getEnv('DEBUG')) || getEnv('NODE_ENV') === 'development'
}

// Helper to identify if debug log level is set
export const isDebugLogLevel = (): boolean => {
  return getEnv('LOG_LEVEL') === 'debug'
}

/**
 * @description Calculates all possible permutations without repetition of a certain size.
 *
 * @param object A collection of distinct values to calculate the permutations from.
 * @param n The number of values to combine.
 *
 * @returns Array of permutations
 */
const permutations = (object: List<string>, n: number) => {
  const array = values(object)
  if (array.length < n) return []

  const recur = (array: string[], n: number) => {
    if (--n < 0) return [[]]

    const permutations: string[][] = []
    array.forEach((value, index, array) => {
      array = array.slice()
      array.splice(index, 1)
      recur(array, n).forEach((permutation) => {
        permutation.unshift(value)
        permutations.push(permutation)
      })
    })
    return permutations
  }
  return recur(array, n)
}

/**
 * @description
 * Builds a permutation set from a list of options
 *
 * @param options The options to create a permutation from
 * @param delimiter (Optional) Joins the permutation results to a string
 *
 * @returns Array of permutations
 */
export const permutator = (options: string[], delimiter?: string): string[] | string[][] => {
  const output = flatMap(options, (_, i, a) => permutations(a, i + 1))
  const join = (combos: string[][]) => combos.map((p) => p.join(delimiter))
  return typeof delimiter === 'string' ? join(output) : output
}

/**
 * @description
 * Check existing (non-undefined) value for its type.
 *
 * @url
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#real-world_usage
 *
 * @param value The value to type check
 * @param fullClass (Optional) Whether to use polyfill for checking null
 *
 * @returns String describing type of obj
 */
export function deepType(value: unknown, fullClass?: boolean): string {
  // get toPrototypeString() of obj (handles all types)
  // Early JS environments return '[object Object]' for null, so it's best to directly check for it.
  if (fullClass) {
    return value === null ? '[object Null]' : Object.prototype.toString.call(value)
  }
  if (value == null) {
    return (value + '').toLowerCase()
  } // implicit toString() conversion

  const deepType = Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
  if (deepType === 'generatorfunction') {
    return 'function'
  }

  // Prevent overspecificity (for example, [object HTMLDivElement], etc).
  // Account for functionish Regexp (Android <=2.3), functionish <object> element (Chrome <=57, Firefox <=52), etc.
  // String.prototype.match is universally supported.

  return deepType.match(/^(array|bigint|date|error|function|generator|regexp|symbol)$/)
    ? deepType
    : typeof value === 'object' || typeof value === 'function'
    ? 'object'
    : typeof value
}

export const LEGACY_ENV_ADAPTER_URL = 'DATA_PROVIDER_URL'
export const ENV_ADAPTER_URL = 'ADAPTER_URL'

export const getURL = (prefix: string, required = false): string | undefined =>
  required
    ? getRequiredURL(prefix)
    : getEnv(ENV_ADAPTER_URL, prefix) || getEnv(LEGACY_ENV_ADAPTER_URL, prefix)

export const getRequiredURL = (prefix: string): string =>
  getRequiredEnv(ENV_ADAPTER_URL, prefix) || getRequiredEnv(LEGACY_ENV_ADAPTER_URL, prefix)

export const getEnvWithFallback = (
  primary: string,
  fallbacks: string[],
  prefix = '',
): string | undefined => {
  // Attempt primary
  const val = getEnv(primary, prefix)
  if (val) return val

  // Attempt fallbacks
  for (const fallback of fallbacks) {
    const val = getEnv(fallback, prefix)
    if (val) return val
  }
  return
}
/**
 * Get variable from environment then check for a fallback if it is not set then throw if neither are set
 * @param primary The name of environment variable to look for first
 * @param prefix A string to add before the environment variable name
 * @param fallbacks The subsequent names of environment variables to look for if the primary is not found
 * @throws {RequiredEnvError} Will throw an error if environment variable is not defined.
 * @returns {string}
 */
export const getRequiredEnvWithFallback = (
  primary: string,
  fallbacks: string[],
  prefix = '',
): string => {
  const env = getEnvWithFallback(primary, fallbacks, prefix)
  if (!env) {
    throw logError(new RequiredEnvError(getEnvName(primary, prefix)))
  }

  return env
}

export function isArraylikeAccessor(x: unknown[]): x is [number] {
  return x.every((i) => typeof i === 'number') && x.length === 1
}

export function isRecord<T extends Record<string | number | symbol, T[keyof T]>>(
  value: unknown,
): value is Record<string | number | symbol, T[keyof T]> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

/**
 * Sleeps for the provided number of milliseconds
 * @param ms The number of milliseconds to sleep for
 * @returns a Promise that resolves once the specified time passes
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Remove stale request entries from an array.
 * This function assumes that the array is sorted by timestamp,
 * where the oldest entry lives in the 0th index, and the newest entry
 * lives in the arr.length-1th index
 * @param items The items to filter
 * @param filter The windowing function to apply
 */
export function sortedFilter<T>(items: T[], windowingFunction: (item: T) => boolean): T[] {
  // if we want a higher performance implementation
  // we can later resort to a custom array class that is circular
  // so we can amortize expensive operations like resizing, and make
  // operations like moving the head index much quicker
  const firstNonStaleItemIndex = items.findIndex(windowingFunction)
  if (firstNonStaleItemIndex === -1) {
    return []
  }

  return items.slice(firstNonStaleItemIndex)
}

//  URL Encoding
const charsToEncode = {
  ':': '%3A',
  '/': '%2F',
  '?': '%3F',
  '#': '%23',
  '[': '%5B',
  ']': '%5D',
  '@': '%40',
  '!': '%21',
  $: '%24',
  '&': '%26',
  "'": '%27',
  '(': '%28',
  ')': '%29',
  '*': '%2A',
  '+': '%2B',
  ',': '%2C',
  ';': '%3B',
  '=': '%3D',
  '%': '%25',
  ' ': '%20',
  '"': '%22',
  '<': '%3C',
  '>': '%3E',
  '{': '%7B',
  '}': '%7D',
  '|': '%7C',
  '^': '%5E',
  '`': '%60',
  '\\': '%5C',
}

/**
 * Check whether the given string contains characters in the given whitelist.
 * @param str The string to check.
 * @param whitelist The string array of whitelist entries. Returns true if any of these are found in 'str', otherwise returns false.
 * @returns {boolean}
 */
const stringHasWhitelist = (str: string, whitelist: string[]): boolean =>
  whitelist.some((el) => str.includes(el))

/**
 * Manually iterate through a given string and replace unsafe/reserved characters with encoded values (unless a character is whitelisted)
 * @param str The string to encode.
 * @param whitelist The string array of whitelist entries.
 * @returns {string}
 */
const percentEncodeString = (str: string, whitelist: string[]): string =>
  str
    .split('')
    .map((char) => {
      const encodedValue = charsToEncode[char as keyof typeof charsToEncode]
      return encodedValue && !whitelist.includes(char) ? encodedValue : char
    })
    .join('')

/**
 * Build a URL path using the given pathTemplate and params. If a param is found in pathTemplate, it will be inserted there; otherwise, it will be ignored.
 * eg.) pathTemplate = "/from/:from/to/:to" and params = { from: "ETH", to: "BTC", note: "hello" } will become "/from/ETH/to/BTC"
 * @param pathTemplate The path template for the URL path. Each param to include in the path should have a prefix of ':'.
 * @param params The object containing keys & values to be added to the URL path.
 * @param whitelist The list of characters to whitelist for the URL path (if a param contains one of your whitelisted characters, it will not be encoded).
 * @returns {string}
 */
export const buildUrlPath = (pathTemplate = '', params = {}, whitelist = ''): string => {
  const allowedChars = whitelist.split('')

  for (const param in params) {
    const value = params[param as keyof typeof params]
    if (!value) continue

    // If string contains a whitelisted character: manually replace any non-whitelisted characters with percent encoded values. Otherwise, encode the string as usual.
    const encodedValue = stringHasWhitelist(value, allowedChars)
      ? percentEncodeString(value, allowedChars)
      : encodeURIComponent(value)

    pathTemplate = pathTemplate.replace(`:${param}`, encodedValue)
  }

  return pathTemplate
}

/**
 * Build a full URL using the given baseUrl, pathTemplate and params. Uses buildUrlPath to add path & params.
 * @param baseUrl The base URL to add the pathTemplate & params to.
 * @param pathTemplate The path template for the URL path. Leave empty if only searchParams are required.
 * @param params The object containing keys & values to be added to the URL path.
 * @param whitelist The list of characters to whitelist for the URL path.
 * @returns {string}
 */
export const buildUrl = (baseUrl: string, pathTemplate = '', params = {}, whitelist = ''): string =>
  new URL(buildUrlPath(pathTemplate, params, whitelist), baseUrl).toString()

//  URL Encoding

let unhandledRejectionHandlerRegistered = false

/**
 * Adapters use to run with Node 14, which by default didn't crash when a rejected promised bubbled up to the top.
 * This function registers a global handler to catch those rejections and just log them to console.
 */
export const registerUnhandledRejectionHandler = (): void => {
  if (unhandledRejectionHandlerRegistered) {
    if (getEnv('NODE_ENV') !== 'test')
      logger.warn('UnhandledRejectionHandler attempted to be registered more than once')
    return
  }

  unhandledRejectionHandlerRegistered = true
  process.on('unhandledRejection', (reason) => {
    logger.warn('Unhandled promise rejection reached custom handler')
    logger.warn(JSON.stringify(reason))
  })
}

export const getClientIp = (req: FastifyRequest): string =>
  req.ip ? req.ip : req.ips?.length ? req.ips[req.ips.length - 1] : 'unknown'

export const RPCErrorMap = {
  NETWORK_ERROR: `The provided RPC network could not be connected.`,
  TIMEOUT: 'Request to the RPC has timed out',
}

export const mapRPCErrorMessage = (errorCode: string, errorMessage: string): string => {
  // Try to transform error message if error is thrown from ether.js
  if (
    errorCode &&
    errorMessage &&
    RPCErrorMap[errorCode as keyof typeof RPCErrorMap] &&
    errorMessage.includes('version')
  ) {
    return RPCErrorMap[errorCode as keyof typeof RPCErrorMap]
  }
  return errorMessage
}

// Utilizes the getPairOptionsMap method to build the TOptions map for an adapter
// This method is used for non-batched requests which would only return a single TOptions
// Non-batched requests will only have a single base and single quote
export const getPairOptions = <TOptions, TInputParameters extends BasePairInputParameters>(
  adapterName: string,
  validator: Validator<TInputParameters>,
  getIncludesOptions: (
    validator: Validator<TInputParameters>,
    include: IncludePair,
  ) => TOptions | undefined,
  defaultGetOptions: (base: string, quote: string) => TOptions,
  customOverrideIncludes?: (base: string, quote: string, includes: string[]) => IncludePair,
): TOptions => {
  const validatedBase = validator.validated.data.base as string
  const validatedQuote = validator.validated.data.quote as string
  const includesOptionsMap = getPairOptionsMap<TOptions, TInputParameters>(
    adapterName,
    validator,
    getIncludesOptions,
    defaultGetOptions,
    customOverrideIncludes,
  )
  return includesOptionsMap[validatedBase][validatedQuote]
}

// Utilizes the getPairOptionsMap method to build the TOptions map for an adapter
// This method is used for batch requests which could return just a single TOptions or a PairOptionsMap (if multiple bases or quotes are passed)
export const getBatchedPairOptions = <TOptions, TInputParameters extends BasePairInputParameters>(
  adapterName: string,
  validator: Validator<TInputParameters>,
  getIncludesOptions: (
    validator: Validator<TInputParameters>,
    include: IncludePair,
  ) => TOptions | undefined,
  defaultGetOptions: (base: string, quote: string) => TOptions,
  customOverrideIncludes?: (base: string, quote: string, includes: string[]) => IncludePair,
): TOptions | PairOptionsMap<TOptions> => {
  const validatedBase = validator.validated.data.base
  const validatedQuote = validator.validated.data.quote
  const includesOptionsMap = getPairOptionsMap<TOptions, TInputParameters>(
    adapterName,
    validator,
    getIncludesOptions,
    defaultGetOptions,
    customOverrideIncludes,
  )
  return Array.isArray(validatedBase) || Array.isArray(validatedQuote)
    ? includesOptionsMap
    : includesOptionsMap[validatedBase][validatedQuote]
}

/**
 * Get request options for base/quote inputs for adapters with `includes.json`. The `includes.json` contains an array
 * of base/quote pairs with related replacement inputs to be used in their place (usually for the purpose of fetching prices through
 * the inverse pair).
 * @param adapterName NAME of adapter to override base symbol from overrides object
 * @param validator Validator object containing base/quote input params to check against `includes.json`
 * @param getIncludesOptions Method to derive request options for base/quote after validator has replaced inputs from `includes.json` if applicable
 * @param defaultGetOptions Method to derive default request options when `getIncludesOptions` fails (ex. if `includes.json` does not include given base/quote pair)
 * @param customOverrideIncludes Method to replace inputs for request if `includes` from request is of type (string[]) but the base/quote are not in the preset `includes` passed to the validator
 * @returns object of request options to use for given base/quote pair from validator
 */
export const getPairOptionsMap = <TOptions, TInputParameters extends BasePairInputParameters>(
  adapterName: string,
  validator: Validator<TInputParameters>,
  getIncludesOptions: (
    validator: Validator<TInputParameters>,
    include: IncludePair,
  ) => TOptions | undefined,
  defaultGetOptions: (base: string, quote: string) => TOptions,
  customOverrideIncludes?: (base: string, quote: string, includes: string[]) => IncludePair,
): PairOptionsMap<TOptions> => {
  const validatedBase = validator.validated.data.base
  const validatedQuote = validator.validated.data.quote
  const includes = validator.validated.includes || []

  const includesOptionsMap: PairOptionsMap<TOptions> = {}

  const bases = Array.isArray(validatedBase) ? validatedBase : [validatedBase]
  const quotes = Array.isArray(validatedQuote) ? validatedQuote : [validatedQuote]

  for (const base of bases) {
    const overrideBase = validator.overrideSymbol(adapterName, base)

    includesOptionsMap[base] = includesOptionsMap[base] ?? {}

    for (const quote of quotes) {
      const overrideQuote = validator.overrideSymbol(adapterName, quote)

      let baseIncludes = validator.overrideIncludes(overrideBase, overrideQuote)

      if (!baseIncludes && typeof includes[0] === 'string') {
        const defaultOverrideIncludes = (base: string, _: string, includes: string[]) => ({
          from: base,
          to: includes[0],
        })
        const getOverrideIncludes = customOverrideIncludes ?? defaultOverrideIncludes
        baseIncludes = getOverrideIncludes(base, quote, includes as string[])
      }

      const includeOptions = baseIncludes && getIncludesOptions(validator, baseIncludes)

      includesOptionsMap[base][quote] =
        includeOptions ?? defaultGetOptions(overrideBase, overrideQuote)
    }
  }

  return includesOptionsMap
}

// Build list of values to censor in logs using the predefined list of sensitive env vars
export const buildCensorList = (): void => {
  const censorList: CensorKeyValue[] = []
  configRedactEnvVars.forEach((envVar) => {
    const value = process.env[envVar]
    if (value) {
      censorList.push({
        key: envVar,
        value: new RegExp(value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi'),
      })
    }
  })
  CensorList.set(censorList)
}

// Logs warnings based on env vars to properly inform of risks involved with using particular settings
export const logEnvVarWarnings = (): void => {
  if (
    getEnv('LOG_LEVEL')?.toUpperCase() === 'DEBUG' ||
    getEnv('LOG_LEVEL')?.toUpperCase() === 'TRACE'
  ) {
    logger.warn(
      `LOG_LEVEL has been set to ${getEnv(
        'LOG_LEVEL',
      )?.toUpperCase()}. Setting higher log levels results in increased memory usage and potentially slower performance.`,
    )
  }
  if (parseBool(getEnv('DEBUG')) === true) {
    logger.warn(`The adapter is running with DEBUG mode on.`)
  }
  if (getEnv('NODE_ENV') === 'development') {
    logger.warn(
      `The adapter is running with NODE_ENV set to development. YOU SHOULD NOT BE RUNNING THIS IN PRODUCTION!`,
    )
  }
  if (parseBool(getEnv('METRICS_ENABLED')) === false) {
    logger.warn(
      `METRICS_ENABLED has been set to ${getEnv(
        'METRICS_ENABLED',
      )}. Metrics should not be disabled in a production environment.`,
    )
  }
  if (getEnv('MAX_PAYLOAD_SIZE_LIMIT') !== baseEnvDefaults.MAX_PAYLOAD_SIZE_LIMIT) {
    logger.warn(
      `MAX_PAYLOAD_SIZE_LIMIT has been set to ${process.env['MAX_PAYLOAD_SIZE_LIMIT']}. This setting should only be set when absolutely necessary.`,
    )
  }
}

// Method to validate env vars and throw error if conditions not met
// Use for env vars that could be fatal if set incorrectly
export const envVarValidations = (): void => {
  const maxPayloadSize = parseInt(getEnv('MAX_PAYLOAD_SIZE_LIMIT') as string)
  if (
    maxPayloadSize < parseInt(baseEnvDefaults.MAX_PAYLOAD_SIZE_LIMIT) ||
    maxPayloadSize > 1073741824
  ) {
    logger.fatal(
      `MAX_PAYLOAD_SIZE_LIMIT set to ${maxPayloadSize}. MAX_PAYLOAD_SIZE_LIMIT must be set between 1048576 (1MB) and 1073741824 (1GB), inclusive`,
    )
    throw new Error(
      'MAX_PAYLOAD_SIZE_LIMIT must be set between 1048576 (1MB) and 1073741824 (1GB), inclusive',
    )
  }
}
