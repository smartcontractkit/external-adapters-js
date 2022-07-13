import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'ELWOOD'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_API_ENDPOINT = 'https://api.demo.elwoodam.net/v1'
export const DEFAULT_WS_API_ENDPOINT = 'wss://api.demo.elwoodam.net/v1/stream'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
