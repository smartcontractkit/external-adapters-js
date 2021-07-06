import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'CRYPTOAPIS'

export const DEFAULT_ENDPOINT = 'price'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.headers['X-API-Key'] = config.apiKey
  config.api.baseURL = 'https://api.cryptoapis.io'
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
