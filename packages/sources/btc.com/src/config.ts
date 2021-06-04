import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'BTC_COM'

export const DEFAULT_BASE_URL = 'https://chain.api.btc.com'

export const DEFAULT_ENDPOINT = 'balance'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  return config
}
