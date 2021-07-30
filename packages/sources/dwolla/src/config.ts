import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'DWOLLA'

export const DEFAULT_ENDPOINT = 'dwolla'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || 'http://localhost:18081'
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
