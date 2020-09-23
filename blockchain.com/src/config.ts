import { logger } from '@chainlink/external-adapter'
import { ChainType } from './endpoint'

export const ENV_API_KEY = 'API_KEY'
export const ENV_API_TIMEOUT = 'API_TIMEOUT'

export const ENDPOINT_MAIN = 'https://blockchain.info/'
export const ENDPOINT_TEST = 'https://testnet.blockchain.info/'

export const DEFAULT_DATA_PATH = 'result'
export const DEFAULT_TIMEOUT = 30000
export const DEFAULT_CONFIRMATIONS = 6
export const DEFAULT_ENDPOINT = 'balance'

export type Config = {
  apiKey?: string
  api: Record<string, unknown>
}

export const getBaseURL = (chain: ChainType): string => {
  switch (chain) {
    case 'mainnet':
      return ENDPOINT_MAIN
    case 'testnet':
      return ENDPOINT_TEST
  }
}

// TODO: add blockchain.info API key support
export const getConfig = (): Config => ({
  apiKey: process.env[ENV_API_KEY],
  api: {
    returnRejectedPromiseOnError: true,
    withCredentials: true,
    timeout: parseInt(process.env[ENV_API_TIMEOUT] as string) || DEFAULT_TIMEOUT,
    headers: {
      common: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
    params: {
      key: process.env[ENV_API_KEY],
    },
  },
})

/* eslint-disable @typescript-eslint/no-unused-vars */
const cloneNoSecrets = (config: Config): Config => (({ apiKey, ...o }) => o)(config)

export const logConfig = (config: Config): void => {
  logger.info('Adapter configuration:', { config: cloneNoSecrets(config) })
  if (!config.apiKey) logger.warn('API will be rate limited without an API key.')
}
