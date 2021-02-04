import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_INTERVAL = '1m'
export const DEFAULT_SORT = 'desc'
export const DEFAULT_MILLISECONDS = 1000000
export const DEFAULT_API_ENDPOINT = 'https://us.market-api.kaiko.io/v2/data/trades.v1'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  config.api.headers['X-Api-Key'] = config.apiKey
  return config
}
