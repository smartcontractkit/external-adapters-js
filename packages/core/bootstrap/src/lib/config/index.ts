import { getRandomRequiredEnv, getRandomEnv, getEnv } from '../util'
import { Config, EnvDefaults } from '@chainlink/types'
import { logger } from '../modules/logger'

const ENV_API_KEY = 'API_KEY'
const ENV_API_ENDPOINT = 'API_ENDPOINT'
const ENV_API_TIMEOUT = 'API_TIMEOUT'
const ENV_API_VERBOSE = 'API_VERBOSE'
const ENV_WS_API_ENDPOINT = 'WS_API_ENDPOINT'
const ENV_WS_API_KEY = 'WS_API_KEY'

const DEFAULT_API_TIMEOUT = 30000

export const constants = {
  ENV_API_KEY,
  ENV_API_ENDPOINT,
  ENV_API_TIMEOUT,
  DEFAULT_API_TIMEOUT,
  ENV_API_VERBOSE,
}

export const baseEnvDefaults: EnvDefaults = {
  BASE_URL: '/',
  EA_PORT: '8080',
  METRICS_PORT: '9080',
  RETRY: '1',
  API_TIMEOUT: '30000',
  SERVER_RATE_LIMIT_MAX: '250', // default to 250 req / 5 seconds max
  SERVER_SLOW_DOWN_AFTER_FACTOR: '0.8', // we start slowing down requests when we reach 80% of our max limit for the current interval
  SERVER_SLOW_DOWN_DELAY_MS: '500', // default to slowing down each request by 500ms
  CACHE_ENABLED: 'true',
  CACHE_TYPE: 'local',
  CACHE_MAX_AGE: '90000', // 1.5 minutes
  CACHE_MIN_AGE: '30000',
  CACHE_MAX_ITEMS: '1000',
  CACHE_UPDATE_AGE_ON_GET: 'false',
  CACHE_REDIS_CONNECTION_TIMEOUT: '15000', // Timeout per long lived connection (ms)
  CACHE_REDIS_HOST: '127.0.0.1', // IP address of the Redis server
  CACHE_REDIS_MAX_QUEUED_ITEMS: '100', // Maximum length of the client's internal command queue
  CACHE_REDIS_MAX_RECONNECT_COOLDOWN: '3000', // Max cooldown time before attempting to reconnect (ms)
  CACHE_REDIS_PORT: '6379', // Port of the Redis server
  CACHE_REDIS_TIMEOUT: '500', // Timeout per request (ms)
  RATE_LIMIT_ENABLED: 'true',
  WARMUP_ENABLED: 'true',
  WARMUP_UNHEALTHY_THRESHOLD: '3',
  WARMUP_SUBSCRIPTION_TTL: '3600000', // default 1h
  REQUEST_COALESCING_INTERVAL: '100',
  REQUEST_COALESCING_INTERVAL_MAX: '1000',
  REQUEST_COALESCING_INTERVAL_COEFFICIENT: '2',
  REQUEST_COALESCING_ENTROPY_MAX: '0',
  REQUEST_COALESCING_MAX_RETRIES: '5',
  WS_ENABLED: 'false', // TODO set to true for WS-only adapters
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

/* eslint-disable @typescript-eslint/no-unused-vars */
const cloneNoSecrets = (config: Config): Config =>
  (({ apiKey, api: { auth, headers, params, ...api }, ...o }) => ({ api, ...o }))(config)

export function getDefaultConfig(prefix = '', requireKey = false, requireWsKey = false): Config {
  const apiKey = requireKey
    ? getRandomRequiredEnv(ENV_API_KEY, ',', prefix)
    : getRandomEnv(ENV_API_KEY, ',', prefix)
  const wsApiKey = requireWsKey
    ? getRandomRequiredEnv(ENV_WS_API_KEY, ',', prefix)
    : getRandomEnv(ENV_WS_API_KEY, ',', prefix)
  const timeout = getEnv(ENV_API_TIMEOUT, prefix)
  return {
    apiKey,
    wsApiKey,
    verbose: !!getEnv(ENV_API_VERBOSE, prefix),
    api: {
      withCredentials: !!apiKey,
      baseURL: getEnv(ENV_API_ENDPOINT, prefix),
      baseWsURL: getEnv(ENV_WS_API_ENDPOINT, prefix),
      timeout: parseInt(timeout || '') || DEFAULT_API_TIMEOUT,
      headers: {
        common: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    },
  }
}

export function logConfig(config: Config): void {
  logger.debug('Adapter configuration:', { config: config && cloneNoSecrets(config) })
}
