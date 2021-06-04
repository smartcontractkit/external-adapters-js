import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = '1FORGE'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_BASE_URL = 'https://api.1forge.com/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_BASE_URL,
    params: {
      api_key: config.apiKey,
    },
  }
  return config
}
