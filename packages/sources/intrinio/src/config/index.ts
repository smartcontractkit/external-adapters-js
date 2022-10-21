import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'INTRINIO'

export const DEFAULT_BASE_URL = 'https://api-v2.intrinio.com/'
// const DEFAULT_WS_API_ENDPOINT = ''

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  return config
}
