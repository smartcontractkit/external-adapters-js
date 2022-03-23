import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'XBTO'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_BASE_URL = 'https://fpiw7f0axc.execute-api.us-east-1.amazonaws.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
