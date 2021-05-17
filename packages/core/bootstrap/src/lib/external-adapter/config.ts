import { getRandomRequiredEnv, getRandomEnv, getEnv } from './util'
import { Config } from '@chainlink/types'
import { logger } from './logger'

const ENV_API_KEY = 'API_KEY'
const ENV_API_ENDPOINT = 'API_ENDPOINT'
const ENV_API_TIMEOUT = 'API_TIMEOUT'
const ENV_API_VERBOSE = 'API_VERBOSE'
const ENV_WS_API_ENDPOINT = 'WS_API_ENDPOINT'

const DEFAULT_API_TIMEOUT = 30000

export const constants = {
  ENV_API_KEY,
  ENV_API_ENDPOINT,
  ENV_API_TIMEOUT,
  DEFAULT_API_TIMEOUT,
  ENV_API_VERBOSE,
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const cloneNoSecrets = (config: Config): Config =>
  (({ apiKey, api: { auth, headers, params, ...api }, ...o }) => ({ api, ...o }))(config)

export function getDefaultConfig(prefix = '', requireKey = false): Config {
  const apiKey = requireKey
    ? getRandomRequiredEnv(ENV_API_KEY, ',', prefix)
    : getRandomEnv(ENV_API_KEY, ',', prefix)
  const timeout = getEnv(ENV_API_TIMEOUT, prefix)
  return {
    apiKey,
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
