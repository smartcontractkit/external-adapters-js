import { util } from '@chainlink/ea-bootstrap'
import { getDefaultConfig } from '@chainlink/external-adapter'
import { getDataProvider } from './dataProvider'
import { Config, DataProviderConfig } from './types'

export const DEFAULT_TOKEN_DECIMALS = 18
export const DEFAULT_TOKEN_BALANCE = 1

export const makeConfig = (prefix = ''): Config => {
  const dataProviderUrl = util.getRequiredEnv('DATA_PROVIDER_URL', prefix)
  const defaultConfig = getDefaultConfig(prefix)
  defaultConfig.api.baseURL = defaultConfig.api.baseURL || dataProviderUrl
  defaultConfig.api.method = 'post'

  return {
    priceAdapter: getDataProvider(defaultConfig.api),
    defaultMethod: util.getEnv('DEFAULT_METHOD', prefix) || 'price',
    defaultQuote: util.getEnv('DEFAULT_QUOTE') || 'USD',
  }
}
