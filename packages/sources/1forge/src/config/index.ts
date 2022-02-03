import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'ADAPTER_1FORGE'

export const DEFAULT_ENDPOINT = 'quotes'
export const DEFAULT_BASE_URL = 'https://api.1forge.com/'
export const DEFAULT_WS_API_ENDPOINT = 'wss://sockets.1forge.com/socket'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_BASE_URL,
    params: {
      api_key: config.apiKey,
    },
  }
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
