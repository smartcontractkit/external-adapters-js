import { util } from '@chainlink/ea-bootstrap'
import { getDefaultConfig } from '@chainlink/external-adapter'
import { getDataProvider } from './dataProvider'
import { Config, DataProviderConfig } from './types'

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

const providers: Record<string, DataProviderConfig> = {
  [DataProvider.Amberdata]: {
    batchingSupport: false,
  },
  [DataProvider.Cryptocompare]: {
    batchingSupport: true,
    batchEndpoint: 'multi',
  },
  [DataProvider.Coinpaprika]: {
    batchingSupport: true,
    batchEndpoint: 'multi',
  },
  [DataProvider.Nomics]: {
    batchingSupport: true,
  },
  [DataProvider.Coinmarketcap]: {
    batchingSupport: true,
  },
  [DataProvider.Coingecko]: {
    batchingSupport: true,
  },
  [DataProvider.Coinapi]: {
    batchingSupport: false,
  },
  [DataProvider.Kaiko]: {
    batchingSupport: false,
  },
}

export const DEFAULT_TOKEN_DECIMALS = 18
export const DEFAULT_TOKEN_BALANCE = 1

export const makeConfig = (prefix = '', provider = ''): Config => {
  const dataProvider = provider || util.getRequiredEnv('DATA_PROVIDER', prefix)
  const dataProviderUrl = util.getRequiredEnv('DATA_PROVIDER_URL', prefix)
  const defaultConfig = getDefaultConfig(prefix)
  defaultConfig.api.baseURL = defaultConfig.api.baseURL || dataProviderUrl
  defaultConfig.api.method = 'post'

  return {
    priceAdapter: getDataProvider(defaultConfig.api, providers[dataProvider]),
    defaultMethod: util.getEnv('DEFAULT_METHOD', prefix) || 'price',
    defaultQuote: util.getEnv('DEFAULT_QUOTE') || 'USD',
  }
}
