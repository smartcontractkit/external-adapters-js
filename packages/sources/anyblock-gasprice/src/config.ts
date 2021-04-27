import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const DEFAULT_API_ENDPOINT = 'https://api.anyblock.tools'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  if (config.apiKey) config.api.headers.authorization = `Bearer ${config.apiKey}`
  return config
}
