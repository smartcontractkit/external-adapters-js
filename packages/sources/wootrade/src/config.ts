import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'WOOTRADE' // This should be filled in with a name corresponding to the data provider using UPPERCASE and _underscores_.

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_BASE_URL = 'https://api.staging.woo.network'
export const DEFAULT_WS_API_ENDPOINT = 'wss://wss.woo.network/ws/stream'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.api.baseWsURL = config.api.baseWsURL || `${DEFAULT_WS_API_ENDPOINT}/${config.apiKey}`
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
