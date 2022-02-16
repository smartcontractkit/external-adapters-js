import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'COINMETRICS'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_BASE_URL = 'https://api.coinmetrics.io/v4'
export const DEFAULT_WS_API_ENDPOINT = 'wss://api.coinmetrics.io/v4'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.api.baseWsURL = config.api.baseWsURL || DEFAULT_WS_API_ENDPOINT
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
