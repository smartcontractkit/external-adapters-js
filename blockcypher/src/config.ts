import { logger } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
export const ENV_API_KEY = 'API_KEY'

export const DEFAULT_DATA_PATH = 'result'
export const DEFAULT_CONFIRMATIONS = 6
export const DEFAULT_ENDPOINT = 'balance'

export type Config = {
  apiKey?: string
}

export const getConfig = (prefix = ''): Config => ({
  apiKey: util.getEnv(ENV_API_KEY, prefix),
})

/* eslint-disable @typescript-eslint/no-unused-vars */
const cloneNoSecrets = (config: Config): Config => (({ apiKey, ...o }) => o)(config)

export const logConfig = (config: Config): void => {
  logger.debug('Adapter configuration:', { config: cloneNoSecrets(config) })
  if (!config.apiKey) logger.warn('API will be rate limited without an API key.')
}
