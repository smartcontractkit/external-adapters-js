import coingecko from './coingecko'
import coinmarketcap from './coinmarketcap'

export type DominanceData = {
  currency: string
  dominance: number
}

enum DominanceDataProvider {
  Coingecko = 'coingecko',
  Coinmarketcap = 'coinmarketcap',
}

const providers: Record<string, DominanceDataAdapter> = {
  [DominanceDataProvider.Coingecko]: coingecko,
  [DominanceDataProvider.Coinmarketcap]: coinmarketcap,
}

export type DominanceDataAdapter = {
  getDominance: (currencies: string[]) => Promise<DominanceData[]>
}

export const getDominanceAdapter = (dataProvider: string): DominanceDataAdapter => {
  return providers[dataProvider]
}

export const dominanceByCurrency = (dominance: DominanceData[]): Record<string, number> => {
  const total = dominance.reduce((total: number, d: DominanceData) => total + d.dominance, 0)
  return Object.fromEntries(dominance.map((it) => [it.currency, it.dominance / total]))
}

Object.fromEntries = (arr: never) => Object.assign({}, ...Array.from(arr, ([k, v]) => ({ [k]: v })))
