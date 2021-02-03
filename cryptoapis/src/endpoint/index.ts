import * as balance from './balance'
import * as price from './price'
import * as bc_info from './bc_info'
import { Endpoint } from '@chainlink/types'

export const Endpoints: Endpoint[] = [balance, price, bc_info]
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
