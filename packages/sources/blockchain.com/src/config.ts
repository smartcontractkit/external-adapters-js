import { util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'BLOCKCHAIN_COM'

export const NAME = 'BLOCKCHAIN_COM'

export const ENV_API_KEY = 'API_KEY'
export const ENV_API_TIMEOUT = 'API_TIMEOUT'

export const API_ENDPOINT_MAIN = 'https://blockchain.info/'
export const API_ENDPOINT_TEST = 'https://testnet.blockchain.info/'

export const DEFAULT_TIMEOUT = 30000
export const DEFAULT_ENDPOINT = 'balance'

export const COIN_KEYS = ['btc'] as const
export type CoinType = typeof COIN_KEYS[number]
export function isCoinType(key: string): key is CoinType {
  return COIN_KEYS.includes(key as CoinType)
}
export const CHAIN_KEYS = ['mainnet', 'testnet'] as const
export type ChainType = typeof CHAIN_KEYS[number]
export function isChainType(key: string): key is ChainType {
  return CHAIN_KEYS.includes(key as ChainType)
}

export const getBaseURL = (chain: ChainType): string => {
  switch (chain) {
    case 'mainnet':
    default:
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
  defaultEndpoint: DEFAULT_ENDPOINT
})
