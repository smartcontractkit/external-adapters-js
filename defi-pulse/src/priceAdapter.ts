import { util } from '@chainlink/ea-bootstrap'
import { IndexAsset } from './adapter'
import cryptocompare from './data-providers/cryptocompare'
import nomics from './data-providers/nomics'
import coinpaprika from './data-providers/coinpaprika'

enum DataProvider {
  Cryptocompare = 'cryptocompare',
  Coinpaprika = 'coinpaprika',
  Nomics = 'nomics',
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
    default:
      throw Error(`Unknown price data provider: ${dataProvider}`)
  }
}
