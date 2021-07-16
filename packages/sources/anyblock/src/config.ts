import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const DEFAULT_BASE_URL = 'https://api.anyblock.tools'

export const DEFAULT_ENDPOINT = 'vwap'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  if (config.apiKey) config.api.headers.authorization = `Bearer ${config.apiKey}`
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
