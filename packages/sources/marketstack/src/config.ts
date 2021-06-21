import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'MARKETSTACK'

export const DEFAULT_INTERVAL = '1min'
export const DEFAULT_LIMIT = 1
export const DEFAULT_ENDPOINT = 'eod'
export const DEFAULT_BASE_URL = 'http://api.marketstack.com/v1/'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.DEFAULT_ENDPOINT = DEFAULT_ENDPOINT
  return config
}
