import { util } from '@chainlink/ea-bootstrap'
import * as cryptocompare from './data-providers/cryptocompare'
import * as nomics from './data-providers/nomics'
import * as coinpaprika from './data-providers/coinpaprika'
import * as coinmarketcap from './data-providers/coinmarketcap'
import * as coingecko from './data-providers/coingecko'
import * as coinapi from './data-providers/coinapi'
import * as amberdata from './data-providers/amberdata'
import * as kaiko from './data-providers/kaiko'
import { Config as DefaultConfig } from '@chainlink/types'
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

export type PriceAdapter = {
  getPrices: (baseSymbols: string[], quote: string) => Promise<Record<string, number>>
  getMarketCaps: (baseSymbols: string[], quote: string) => Promise<Record<string, number>>
}

export type Config = DefaultConfig & {
  priceAdapter: PriceAdapter
  defaultMethod: string
}

export const DEFAULT_TOKEN_DECIMALS = 18
export const DEFAULT_TOKEN_BALANCE = 1

export const makeConfig = (prefix = ''): Config => {
  const dataProvider = util.getRequiredEnv('DATA_PROVIDER', prefix)
  return {
    priceAdapter: providers[dataProvider],
    defaultMethod: util.getEnv('DEFAULT_METHOD', prefix) || 'price',
  }
}
