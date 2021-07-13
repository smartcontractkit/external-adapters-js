import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'ORCHID_BANDWIDTH'

export const DEFAULT_ENDPOINT = 'bandwidth'
export const DEFAULT_BASE_URL = 'https://chainlink.orchid.com/0'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
