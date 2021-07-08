import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'AMBERDATA'

export const DEFAULT_API_ENDPOINT = 'https://web3api.io'
export const DEFAULT_WS_API_ENDPOINT = 'wss://ws.web3api.io'

export const COIN_KEYS = ['btc', 'eth', 'bch', 'ltc', 'btsv', 'zec'] as const
export type CoinType = typeof COIN_KEYS[number]
export function isCoinType(key: string): key is CoinType {
  return COIN_KEYS.includes(key as CoinType)
}
export const CHAIN_KEYS = ['mainnet'] as const
export type ChainType = typeof CHAIN_KEYS[number]
export function isChainType(key: string): key is ChainType {
  return CHAIN_KEYS.includes(key as ChainType)
}

export const BLOCKCHAINS: { [ticker: string]: string } = {
  btc: 'bitcoin',
  eth: 'ethereum',
  bch: 'bitcoin-abc',
  ltc: 'litecoin',
  btsv: 'bitcoin-sv',
  zec: 'zcash',
}

const DEFAULT_ENDPOINT = 'price'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.headers['x-api-key'] = config.apiKey
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
