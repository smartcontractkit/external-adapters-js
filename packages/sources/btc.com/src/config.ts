import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'BTC_COM'

export const DEFAULT_BASE_URL = 'https://chain.api.btc.com'

export const DEFAULT_ENDPOINT = 'balance'

export const COIN_KEYS = ['btc'] as const
export type CoinType = typeof COIN_KEYS[number]
export function isCoinType(key: string): key is CoinType {
  return COIN_KEYS.includes(key as CoinType)
}
export const CHAIN_KEYS = ['mainnet'] as const
export type ChainType = typeof CHAIN_KEYS[number]
export function isChainType(key: string): key is ChainType {
  return CHAIN_KEYS.includes(key as ChainType)
}

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
