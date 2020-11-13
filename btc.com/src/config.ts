import { logger } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

export const ENV_API_TIMEOUT = 'API_TIMEOUT'

export const ENDPOINT_MAIN = 'https://chain.api.btc.com'

export const DEFAULT_DATA_PATH = 'addresses'
export const DEFAULT_TIMEOUT = 30000
export const DEFAULT_CONFIRMATIONS = 6
export const DEFAULT_ENDPOINT = 'balance'

export type Config = {
  apiKey?: string
  api: Record<string, unknown>
}

export const getBaseURL = (): string => ENDPOINT_MAIN

export const getConfig = (prefix = ''): Config => ({
  api: {
    returnRejectedPromiseOnError: true,
    withCredentials: false,
    timeout: parseInt(util.getEnv(ENV_API_TIMEOUT, prefix) as string) || DEFAULT_TIMEOUT,
    headers: {
      common: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  },
})

/* eslint-disable @typescript-eslint/no-unused-vars */
const cloneNoSecrets = (config: Config): Config => (({ apiKey, ...o }) => o)(config)

export const logConfig = (config: Config): void => {
  logger.debug('Adapter configuration:', { config: config && cloneNoSecrets(config) })
}
