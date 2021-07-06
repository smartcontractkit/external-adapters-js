import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'COINGECKO'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_API_ENDPOINT = 'https://api.coingecko.com/api/v3'
export const PRO_API_ENDPOINT = 'https://pro-api.coingecko.com/api/v3'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  if (!config.api.baseURL) {
    config.api.baseURL = config.apiKey !== undefined ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT
  }
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
