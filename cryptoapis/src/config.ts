import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'price'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.headers['X-API-Key'] = config.apiKey
  config.api.baseURL = 'https://api.cryptoapis.io'
  config.DEFAULT_ENDPOINT = DEFAULT_ENDPOINT
  return config
}
