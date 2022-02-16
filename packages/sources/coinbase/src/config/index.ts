import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'COINBASE'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_API_ENDPOINT = 'https://api.coinbase.com'
export const DEFAULT_WS_API_ENDPOINT = 'wss://ws-feed.pro.coinbase.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
