import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const ENDPOINT_MAIN = 'https://web3api.io'

export const DEFAULT_ENDPOINT = 'price'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.headers['x-api-key'] = config.apiKey
  config.api.baseURL = ENDPOINT_MAIN
  return config
}
