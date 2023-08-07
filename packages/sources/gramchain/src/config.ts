import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'GRAMCHAIN'

export const DEFAULT_ENDPOINT = 'getgrambalances'
export const DEFAULT_BASE_URL = 'https://api-prod.gramchain.net/api/public'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
