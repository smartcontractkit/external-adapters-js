import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'IEXCloud'

export const DEFAULT_ENDPOINT = 'stock'
export const DEFAULT_BASE_URL = 'https://cloud.iexapis.com/stable'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  return config
}
