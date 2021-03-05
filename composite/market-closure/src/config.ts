import { getDefaultConfig } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import { getDataProvider, PriceAdapter } from './dataProvider'
import { Check, getCheckImpl, getCheckProvider } from './checks'

export type Config = {
  priceAdapter: PriceAdapter
  checkAdapter: Check
}

export const makeConfig = (prefix = ''): Config => {
  const dataProviderUrl = util.getRequiredEnv('DATA_PROVIDER_URL', prefix)
  const defaultConfig = getDefaultConfig(prefix)
  defaultConfig.api.baseURL = dataProviderUrl
  defaultConfig.api.method = 'post'

  return {
    priceAdapter: getDataProvider(defaultConfig.api),
    checkAdapter: getCheckImpl(getCheckProvider()),
  }
}
