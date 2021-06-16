import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'BINANCE'

export const DEFAULT_ENDPOINT = 'ticker'
export const DEFAULT_BASE_URL = 'https://api.binance.com'
export const DEFAULT_WS_API_ENDPOINT = 'wss://stream.binance.com:9443/ws'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.DEFAULT_ENDPOINT = DEFAULT_ENDPOINT
  return config
}
