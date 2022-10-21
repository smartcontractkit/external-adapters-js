import { Requester } from '@chainlink/ea-bootstrap'
import { DefaultConfig } from '@chainlink/ea-bootstrap'

export const NAME = 'COINAPI'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_BASE_URL = 'https://rest.coinapi.io/v1/'
export const DEFAULT_WS_API_ENDPOINT = 'wss://ws.coinapi.io/v1/'

export const makeConfig = (prefix?: string): DefaultConfig => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL ?? DEFAULT_BASE_URL,
    params: {
      apikey: config.apiKey,
    },
  }
  config.defaultEndpoint = DEFAULT_ENDPOINT
  config.ws.baseWsURL = config.ws.baseWsURL || DEFAULT_WS_API_ENDPOINT
  return config
}
