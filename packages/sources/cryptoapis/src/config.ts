import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'CRYPTOAPIS'

export const DEFAULT_ENDPOINT = 'price'

export const COIN_KEYS = ['btc', 'eth', 'etc', 'bch', 'ltc', 'dash', 'doge', 'btcv', 'zil'] as const
export type CoinType = typeof COIN_KEYS[number]
export function isCoinType(key: string): key is CoinType {
  return COIN_KEYS.includes(key as CoinType)
}
export const CHAIN_KEYS = ['mainnet', 'testnet'] as const
export type ChainType = typeof CHAIN_KEYS[number]
export function isChainType(key: string): key is ChainType {
  return CHAIN_KEYS.includes(key as ChainType)
}

export const TESTNET_BLOCKCHAINS: { [ticker: string]: string } = {
  eth: 'rinkeby',
  etc: 'mordor',
}

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.headers['X-API-Key'] = config.apiKey
  config.api.baseURL = 'https://api.cryptoapis.io'
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
