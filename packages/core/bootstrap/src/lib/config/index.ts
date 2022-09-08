import { baseEnvDefaults, getRandomRequiredEnv, getRandomEnv, getEnv, parseBool } from '../util'
import type { Config, DefaultConfig } from '../../types'
import { logger } from '../modules/logger'

const ENV_API_KEY = 'API_KEY'
const ENV_API_ENDPOINT = 'API_ENDPOINT'
const ENV_API_TIMEOUT = 'API_TIMEOUT'
const ENV_API_VERBOSE = 'API_VERBOSE'
const ENV_WS_API_ENDPOINT = 'WS_API_ENDPOINT'
const ENV_WS_API_KEY = 'WS_API_KEY'

export const constants = {
  ENV_API_KEY,
  ENV_API_ENDPOINT,
  ENV_API_TIMEOUT,
  ENV_API_VERBOSE,
}

export function getDefaultConfig(
  prefix = '',
  requireKey = false,
  requireWsKey = false,
): DefaultConfig {
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
    verbose: parseBool(getEnv(ENV_API_VERBOSE, prefix)),
    api: {
      withCredentials: !!apiKey,
      baseURL: getEnv(ENV_API_ENDPOINT, prefix),
      timeout: parseInt(timeout || '') || parseInt(baseEnvDefaults.API_TIMEOUT),
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
    ws: {
      baseWsURL: getEnv(ENV_WS_API_ENDPOINT, prefix),
    },
  }
}

export function logConfig(config: Config): void {
  logger.debug('Adapter configuration:', { config })
}
