import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'BLOCKSIZE_CAPITAL'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_BASE_WS_URL = 'wss://data.blocksize.capital/marketdata/v1/ws'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseWebsocketURL ||= DEFAULT_BASE_WS_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
