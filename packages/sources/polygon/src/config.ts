import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'POLYGON'

export const DEFAULT_ENDPOINT = 'tickers'
export const DEFAULT_BASE_URL = 'https://api.polygon.io'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.api.params = { apikey: config.apiKey }
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
