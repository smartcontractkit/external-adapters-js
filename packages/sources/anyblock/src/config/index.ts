import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const DEFAULT_BASE_URL = 'https://svc.blockdaemon.com'
export const NAME = 'ANYBLOCK'

export const DEFAULT_ENDPOINT = 'gasprice'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  if (config.apiKey)
    config.api.headers = { ...config.api.headers, authorization: `Bearer ${config.apiKey}` }
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
