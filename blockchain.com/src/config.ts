import { ChainType } from './endpoint'

export const ENV_API_TOKEN = 'API_TOKEN'
export const ENV_API_TIMEOUT = 'API_TIMEOUT'

export const ENDPOINT_MAIN = 'https://blockchain.info/'
export const ENDPOINT_TEST = 'https://testnet.blockchain.info/'

export const DEFAULT_DATA_PATH = 'result'
export const DEFAULT_TIMEOUT = 30000
export const DEFAULT_CONFIRMATIONS = 6
export const DEFAULT_ENDPOINT = 'balance'

export type Config = {
  token?: string
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
  token: process.env[ENV_API_TOKEN],
  api: {
    returnRejectedPromiseOnError: true,
    withCredentials: true,
    timeout:
      parseInt(process.env[ENV_API_TIMEOUT] as string) || DEFAULT_TIMEOUT,
    headers: {
      common: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
    params: {
      key: process.env[ENV_API_TOKEN]
    },
  },
})

/* eslint-disable @typescript-eslint/no-unused-vars */
const cloneNoSecrets = (config: Config): Config =>
  (({ token, ...o }) => o)(config)

export const logConfig = (config: Config): void => {
  console.log('Adapter configuration:')
  console.log(cloneNoSecrets(config))
  if (!config.token)
    console.warn('API will be rate limited without an API token.')
}
