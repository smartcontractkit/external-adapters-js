import { Config } from '@chainlink/types'
import { Requester } from '@chainlink/ea-bootstrap'

export const NAME = 'IPFS'
export const DEFAULT_ENDPOINT = 'read'
export const DEFAULT_API_URL = 'http://127.0.0.1:5001'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
