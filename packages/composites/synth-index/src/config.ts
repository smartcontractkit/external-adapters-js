import { util, Requester } from '@chainlink/ea-bootstrap'
import { NAME } from '@chainlink/token-allocation-adapter'
import { RequestConfig } from '@chainlink/types'

export type Config = {
  defaultNetwork: string
  defaultQuote: string
  taConfig: RequestConfig
}

export const DEFAULT_NETWORK = 'mainnet'
export const DEFAULT_QUOTE = 'USD'

export const makeConfig = (prefix = ''): Config => {
  const defaultConfig = Requester.getDefaultConfig(prefix)
  defaultConfig.api.baseURL = util.getRequiredEnv(`${NAME}_DATA_PROVIDER_URL`)
  defaultConfig.api.method = 'post'
  return {
    defaultNetwork: util.getEnv('DEFAULT_NETWORK') || DEFAULT_NETWORK,
    defaultQuote: util.getEnv('DEFAULT_QUOTE') || DEFAULT_QUOTE,
    taConfig: defaultConfig.api,
  }
}
