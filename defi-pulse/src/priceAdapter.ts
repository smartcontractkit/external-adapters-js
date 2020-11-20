import { util } from '@chainlink/ea-bootstrap'
import { IndexAsset } from './adapter'
import cryptocompare from './data-providers/cryptocompare'

enum DataProvider {
  Cryptocompare = 'cryptocompare',
  Coingecko = 'coingecko',
}

type CalculateIndex = (index: IndexAsset[]) => number
type GetPriceIndex = (index: IndexAsset[]) => Promise<IndexAsset[]>

type PriceAdapter = {
  calculateIndex: CalculateIndex
  getPriceIndex: GetPriceIndex
}

export const getPriceAdapter = (): PriceAdapter => {
  const dataProvider = util.getRequiredEnv('DATA_PROVIDER')
  switch (dataProvider) {
    case DataProvider.Cryptocompare:
      return cryptocompare
    // case DataProvider.FCS_API:
    //   return fcsapi.execute
    default:
      throw Error(`Unknown price data provider: ${dataProvider}`)
  }
}
