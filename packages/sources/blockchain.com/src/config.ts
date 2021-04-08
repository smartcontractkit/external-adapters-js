import { util } from '@chainlink/ea-bootstrap'
import { ChainType } from './endpoint'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_KEY:
 *      required: false
 *
 */

export const ENV_API_KEY = 'API_KEY'
export const ENV_API_TIMEOUT = 'API_TIMEOUT'

export const API_ENDPOINT_MAIN = 'https://blockchain.info/'
export const API_ENDPOINT_TEST = 'https://testnet.blockchain.info/'

export const DEFAULT_TIMEOUT = 30000
export const DEFAULT_ENDPOINT = 'balance'

export const getBaseURL = (chain: ChainType): string => {
  switch (chain) {
    case 'mainnet':
      return API_ENDPOINT_MAIN
    case 'testnet':
      return API_ENDPOINT_TEST
  }
}

export const makeConfig = (prefix = ''): Config => ({
  apiKey: util.getEnv(ENV_API_KEY, prefix),
  returnRejectedPromiseOnError: true,
  api: {
    withCredentials: true,
    timeout: parseInt(util.getEnv(ENV_API_TIMEOUT, prefix) as string) || DEFAULT_TIMEOUT,
    headers: {
      common: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
    params: {
      key: util.getEnv(ENV_API_KEY, prefix),
    },
  },
})
