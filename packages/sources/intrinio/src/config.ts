import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'INTRINIO'

export const DEFAULT_API_ENDPOINT = 'https://api-v2.intrinio.com/'
// const DEFAULT_WS_API_ENDPOINT = ''

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  return config
}
