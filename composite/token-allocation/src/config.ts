import { util } from '@chainlink/ea-bootstrap'
import * as cryptocompare from './data-providers/cryptocompare'
import * as nomics from './data-providers/nomics'
import * as coinpaprika from './data-providers/coinpaprika'
import * as coinmarketcap from './data-providers/coinmarketcap'
import * as coingecko from './data-providers/coingecko'
import * as coinapi from './data-providers/coinapi'
import * as amberdata from './data-providers/amberdata'
import * as kaiko from './data-providers/kaiko'
import { Config, PriceAdapter } from './types'

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

export const DEFAULT_TOKEN_DECIMALS = 18
export const DEFAULT_TOKEN_BALANCE = 1

export const makeConfig = (provider = '', prefix = ''): Config => {
  const dataProvider = provider || util.getRequiredEnv('DATA_PROVIDER', prefix)
  return {
    priceAdapter: providers[dataProvider],
    defaultMethod: util.getEnv('DEFAULT_METHOD', prefix) || 'price',
    defaultQuote: util.getEnv('DEFAULT_QUOTE') || 'USD',
  }
}
