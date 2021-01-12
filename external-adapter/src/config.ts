import { util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'
import { logger } from './logger'

const ENV_API_KEY = 'API_KEY'
const ENV_API_ENDPOINT = 'API_ENDPOINT'
const ENV_API_TIMEOUT = 'API_TIMEOUT'
const ENV_API_VERBOSE = 'API_VERBOSE'
const DEFAULT_API_TIMEOUT = 30000

export const constants = {
  ENV_API_KEY,
  ENV_API_ENDPOINT,
  ENV_API_TIMEOUT,
  DEFAULT_API_TIMEOUT,
  ENV_API_VERBOSE,
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const cloneNoSecrets = (config: Config): Config => (({ apiKey, ...o }) => o)(config)

export function getDefaultConfig(prefix = ''): Config {
  const apiKey = util.getEnv(ENV_API_KEY, prefix)
  const timeout = util.getEnv(ENV_API_TIMEOUT, prefix)
  return {
    apiKey,
    verbose: !!util.getEnv(ENV_API_VERBOSE, prefix),
    api: {
      withCredentials: !!apiKey,
      baseURL: util.getEnv(ENV_API_ENDPOINT, prefix),
      timeout: parseInt(timeout) || DEFAULT_API_TIMEOUT,
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
  if (!config.apiKey) logger.warn('API will be rate limited without an API key.')
}
