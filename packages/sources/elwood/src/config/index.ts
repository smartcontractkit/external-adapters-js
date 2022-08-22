import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'ELWOOD'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_API_ENDPOINT = 'https://api.chk.elwood.systems/v1/stream'
export const DEFAULT_WS_API_ENDPOINT = 'wss://api.chk.elwood.systems/v1/stream'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  config.ws.baseWsURL = config.ws.baseWsURL || DEFAULT_WS_API_ENDPOINT
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
