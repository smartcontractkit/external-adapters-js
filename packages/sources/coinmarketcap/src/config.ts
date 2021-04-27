import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'COINMARKETCAP'

export const DEFAULT_ENDPOINT = 'price'
const DEFAULT_API_ENDPOINT = 'https://pro-api.coinmarketcap.com/v1/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  config.api.headers = {
    'X-CMC_PRO_API_KEY': config.apiKey,
  }
  return config
}
