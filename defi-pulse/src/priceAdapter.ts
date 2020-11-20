import { util } from '@chainlink/ea-bootstrap'
import { IndexAsset } from './adapter'
import cryptocompare from './data-providers/cryptocompare'
import nomics from './data-providers/nomics'
import coinpaprika from './data-providers/coinpaprika'
import coinmarketcap from './data-providers/coinmarketcap'
import coingecko from './data-providers/coingecko'
import coinapi from './data-providers/coinapi'

enum DataProvider {
  Cryptocompare = 'cryptocompare',
  Coinpaprika = 'coinpaprika',
  Nomics = 'nomics',
  Coinmarketcap = 'coinmarketcap',
  Coingecko = 'coingecko',
  Coinapi = 'coinapi',
}

export type CalculateIndex = (index: IndexAsset[]) => number
export type GetPriceIndex = (index: IndexAsset[]) => Promise<IndexAsset[]>

type PriceAdapter = {
  calculateIndex: CalculateIndex
  getPriceIndex: GetPriceIndex
}

export const getPriceAdapter = (): PriceAdapter => {
  const dataProvider = util.getRequiredEnv('DATA_PROVIDER')
  switch (dataProvider) {
    case DataProvider.Cryptocompare:
      return cryptocompare
    case DataProvider.Nomics:
      return nomics
    case DataProvider.Coinpaprika:
      return coinpaprika
    case DataProvider.Coinmarketcap:
      return coinmarketcap
    case DataProvider.Coingecko:
      return coingecko
    case DataProvider.Coinapi:
      return coinapi
    default:
      throw Error(`Unknown price data provider: ${dataProvider}`)
  }
}
