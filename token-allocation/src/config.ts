import types from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'
import { Index } from './adapter'
import cryptocompare from './data-providers/cryptocompare'
import nomics from './data-providers/nomics'
import coinpaprika from './data-providers/coinpaprika'
import coinmarketcap from './data-providers/coinmarketcap'
import coingecko from './data-providers/coingecko'
import coinapi from './data-providers/coinapi'
import amberdata from './data-providers/amberdata'
import kaiko from './data-providers/kaiko'

enum DataProvider {
  Amberdata = 'amberdata',
  Bravenewcoin = 'bravenewcoin',
  Cryptocompare = 'cryptocompare',
  Coinpaprika = 'coinpaprika',
  Nomics = 'nomics',
  Coinmarketcap = 'coinmarketcap',
  Coingecko = 'coingecko',
  Coinapi = 'coinapi',
  Kaiko = 'kaiko',
}

const providers: Record<string, PriceAdapter> = {
  [DataProvider.Amberdata]: amberdata,
  [DataProvider.Cryptocompare]: cryptocompare,
  [DataProvider.Coinpaprika]: coinpaprika,
  [DataProvider.Nomics]: nomics,
  [DataProvider.Coinmarketcap]: coinmarketcap,
  [DataProvider.Coingecko]: coingecko,
  [DataProvider.Coinapi]: coinapi,
  [DataProvider.Kaiko]: kaiko,
}

type GetPriceIndex = (index: Index, currency: string) => Promise<Index>

export type PriceAdapter = {
  getPriceIndex: GetPriceIndex
}

export type Config = types.Config & {
  priceAdapter: PriceAdapter
  defaultCurrency: string
}

const getPriceAdapter = (dataProvider: string): PriceAdapter => {
  return providers[dataProvider]
}

export const makeConfig = (): Config => {
  const dataProvider = util.getRequiredEnv('DATA_PROVIDER')
  const defaultCurrency = util.getEnv('CURRENCY') || 'USD'
  const priceAdapter = getPriceAdapter(dataProvider)
  return { priceAdapter, defaultCurrency }
}
