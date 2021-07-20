import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'NIKKEI'

export const DEFAULT_ENDPOINT = 'stock'
export const DEFAULT_BASE_URL = 'https://indexes.nikkei.co.jp/en/nkave/'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
