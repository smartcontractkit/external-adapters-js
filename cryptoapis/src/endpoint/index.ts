export * as balance from './balance'
export * as price from './price'
export * as difficulty from './difficulty'

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
