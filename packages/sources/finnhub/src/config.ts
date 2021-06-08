import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'Finnhub'

export const DEFAULT_BASE_URL = 'https://finnhub.io/api/v1/'
export const DEFAULT_ENDPOINT = 'quote'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  return config
}
