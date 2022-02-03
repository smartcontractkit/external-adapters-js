import { HTTP } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'ADAPTER_1FORGE'

export const DEFAULT_ENDPOINT = 'quotes'
export const DEFAULT_BASE_URL = 'https://api.1forge.com/'

export const makeConfig = (prefix?: string): Config => {
  const config = HTTP.getDefaultConfig(prefix, true)
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
