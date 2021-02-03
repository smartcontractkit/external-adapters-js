import * as balance from './balance'
import * as price from './price'
import { Endpoint } from '@chainlink/types'

export const Endpoints: Endpoint[] = [balance, price]

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
