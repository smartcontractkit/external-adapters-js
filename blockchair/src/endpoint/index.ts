export * as balance from './balance'
export * as difficulty from './difficulty'

export type CoinType = 'btc'
export type ChainType = 'mainnet'

export const COINS: { [ticker: string]: string } = {
  btc: 'bitcoin',
  dash: 'dash',
  doge: 'dogecoin',
  ltc: 'litecoin',
  zec: 'zcash',
  bch: 'bitcoin-cash',
  bsv: 'bitcoin-sv',
  grs: 'groestlcoin',
}
