import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'COINRANKING'

export const DEFAULT_ENDPOINT = 'coin'
export const DEFAULT_API_ENDPOINT = 'https://api.coinranking.com/v2'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_API_ENDPOINT
  }

  if (config.apiKey) {
    config.api.headers['x-access-token'] = config.apiKey
  }

  return config
}
