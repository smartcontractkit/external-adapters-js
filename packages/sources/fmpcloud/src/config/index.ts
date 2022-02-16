import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'FMPCLOUD'

export const DEFAULT_ENDPOINT = 'stock'
export const DEFAULT_BASE_URL = 'https://fmpcloud.io'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_BASE_URL,
    params: {
      apikey: config.apiKey,
    },
  }
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
