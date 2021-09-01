import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'TRADERMADE'
export const DEFAULT_WS_API_ENDPOINT = 'wss://marketdata.tradermade.com/feedadv'
export const DEFAULT_ENDPOINT = 'live'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || 'https://marketdata.tradermade.com/api/v1/live'
  config.api.baseWsURL = config.api.baseWsURL || DEFAULT_WS_API_ENDPOINT
  config.defaultEndpoint = DEFAULT_ENDPOINT
  config.api.params = { api_key: config.apiKey }
  return config
}
