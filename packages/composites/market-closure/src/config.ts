import { Requester, util } from '@chainlink/ea-bootstrap'
import { getDataProvider, PriceAdapter } from './dataProvider'

export const DEFAULT_NETWORK = 'ETHEREUM'

export type GetPriceAdapter = (name: string) => PriceAdapter

export type Config = {
  getPriceAdapter: GetPriceAdapter
}

export const makeConfig = (prefix = ''): Config => {
  const getPriceAdapter: GetPriceAdapter = (name) => {
    const dataProviderUrl = util.getRequiredEnv('ADAPTER_URL', name.toUpperCase())
    const defaultConfig = Requester.getDefaultConfig(prefix)
    defaultConfig.api.baseURL = dataProviderUrl
    defaultConfig.api.method = 'post'
    return getDataProvider(defaultConfig.api)
  }

  return { getPriceAdapter }
}
