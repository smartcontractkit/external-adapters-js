import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'CRYPTOCOMPARE'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_API_ENDPOINT = 'https://min-api.cryptocompare.com'
export const DEFAULT_WS_API_ENDPOINT = 'wss://streamer.cryptocompare.com/v2'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  if (config.apiKey)
    config.api.headers = {
      ...config.api.headers,
      authorization: `Apikey ${config.apiKey}`,
    }
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
