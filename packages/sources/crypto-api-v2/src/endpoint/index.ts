export * as balance from './balance'
export * as price from './price'
export * as bc_info from './bc_info'

export const BLOCKCHAIN_NAME_MAP: { [key: string]: string } = {
  "btc": "bitcoin",
  "eth": "ethereum",
  "ltc": "litecoin",
  "etc": "ethereum-classic",
  "bch": "bitcoin-cash",
  "dash": "dash",
  "doge": "dogecoin"
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
  "ethereum": 'rinkeby',
  "ethereum-classic": 'mordor',
}
