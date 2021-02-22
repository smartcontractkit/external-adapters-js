import { util } from '@chainlink/ea-bootstrap'
import { getDefaultConfig } from '@chainlink/external-adapter'
import { getDataProvider } from './dataProvider'
import { Config } from './types'

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

const providers: Record<string, any> = {
  [DataProvider.Amberdata]: {
    batchingSupport: false,
    defaultDataUrl: 'http://localhost:8080',
  },
  [DataProvider.Cryptocompare]: {
    batchingSupport: true,
    defaultDataUrl: 'http://localhost:8080',
  },
  [DataProvider.Coinpaprika]: {
    batchingSupport: true,
    defaultDataUrl: 'http://localhost:8080',
  },
  [DataProvider.Nomics]: {
    batchingSupport: true,
    defaultDataUrl: 'http://localhost:8080',
  },
  [DataProvider.Coinmarketcap]: {
    batchingSupport: true,
    defaultDataUrl: 'http://localhost:8080',
  },
  [DataProvider.Coingecko]: {
    batchingSupport: true,
    defaultDataUrl: 'http://localhost:8080',
  },
  [DataProvider.Coinapi]: {
    batchingSupport: false,
    defaultDataUrl: 'http://localhost:8080',
  },
  [DataProvider.Kaiko]: {
    batchingSupport: false,
    defaultDataUrl: 'http://localhost:8080',
  },
}

export const DEFAULT_TOKEN_DECIMALS = 18
export const DEFAULT_TOKEN_BALANCE = 1

export const makeConfig = (prefix = '', provider = ''): Config => {
  const dataProvider = provider || util.getRequiredEnv('DATA_PROVIDER', prefix)
  const dataProviderUrl =
    util.getEnv('DATA_PROVIDER_URL', prefix) || providers[dataProvider].defaultDataUrl
  const defaultConfig = getDefaultConfig(prefix)
  defaultConfig.api.baseURL = defaultConfig.api.baseURL || dataProviderUrl
  defaultConfig.api.method = 'post'

  return {
    priceAdapter: getDataProvider(defaultConfig.api, providers[dataProvider].batchingSupport),
    defaultMethod: util.getEnv('DEFAULT_METHOD', prefix) || 'price',
    defaultQuote: util.getEnv('DEFAULT_QUOTE') || 'USD',
  }
}
