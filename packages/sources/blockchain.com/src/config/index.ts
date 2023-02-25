import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'BLOCKCHAIN_COM'

export const ENV_API_KEY = 'API_KEY'
export const ENV_API_TIMEOUT = 'API_TIMEOUT'

export const API_ENDPOINT_MAIN = 'https://blockchain.info/'
export const API_ENDPOINT_TEST = 'https://testnet.blockchain.info/'

export const DEFAULT_TIMEOUT = 30000
export const DEFAULT_ENDPOINT = 'balance'

export const COIN_KEYS = ['btc'] as const
export type CoinType = (typeof COIN_KEYS)[number]
export function isCoinType(key: string): key is CoinType {
  return COIN_KEYS.includes(key as CoinType)
}
export const CHAIN_KEYS = ['mainnet', 'testnet'] as const
export type ChainType = (typeof CHAIN_KEYS)[number]
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

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  if (config.apiKey)
    config.api.params = {
      ...config.api.params,
      key: config.apiKey,
    }
  config.defaultEndpoint = DEFAULT_ENDPOINT
  config.returnRejectedPromiseOnError = true
  return config
}
