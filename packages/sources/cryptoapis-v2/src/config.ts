import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'price'
export const NAME = 'CRYPTOAPIS_V2'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.headers['X-API-Key'] = config.apiKey
  config.api.baseURL = 'https://rest.cryptoapis.io'
  return config
}

export const BLOCKCHAIN_NAME_MAP: { [key: string]: string } = {
  btc: 'bitcoin',
  eth: 'ethereum',
  ltc: 'litecoin',
  etc: 'ethereum-classic',
  bch: 'bitcoin-cash',
  dash: 'dash',
  doge: 'dogecoin',
}

export function isCoinType(key: string): boolean {
  return !!BLOCKCHAIN_NAME_MAP[key.toLowerCase()]
}
export const CHAIN_KEYS = ['mainnet', 'testnet'] as const
export type ChainType = typeof CHAIN_KEYS[number]
export function isChainType(key: string): key is ChainType {
  return CHAIN_KEYS.includes(key as ChainType)
}

export const TESTNET_BLOCKCHAINS: { [ticker: string]: string } = {
  ethereum: 'rinkeby',
  'ethereum-classic': 'mordor',
}
