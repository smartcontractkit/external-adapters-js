import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'CURRENCYLAYER'

export const DEFAULT_ENDPOINT = 'live'
export const DEFAULT_BASE_URL = 'https://api.currencylayer.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_BASE_URL,
    params: {
      access_key: config.apiKey,
    },
  }
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
