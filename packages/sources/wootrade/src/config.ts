import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'WOOTRADE'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_BASE_URL = 'https://api.woo.network'
export const DEFAULT_WS_API_ENDPOINT = 'wss://wss.woo.network/ws/stream'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.api.baseWsURL = config.api.baseWsURL || `${DEFAULT_WS_API_ENDPOINT}/${config.apiKey}`
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
