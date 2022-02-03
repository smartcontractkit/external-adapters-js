import { HTTP } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'MYCRYPTOAPI'

export const DEFAULT_ENDPOINT = 'gasprice'
export const DEFAULT_BASE_URL = 'https://gas.mycryptoapi.com/'

export const makeConfig = (prefix?: string): Config => {
  const config = HTTP.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
