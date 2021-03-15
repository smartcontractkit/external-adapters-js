import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'price'

const DEFAULT_API_ENDPOINT = 'https://pro-api.coinmarketcap.com/v1/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseUrl || DEFAULT_API_ENDPOINT
  config.api.headers = {
    'X-CMC_PRO_API_KEY': config.apiKey,
  }
  return config
}
