import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'KAIKO'

export const DEFAULT_INTERVAL = '1m'
export const DEFAULT_SORT = 'desc'
export const DEFAULT_MILLISECONDS = 1800000
export const DEFAULT_API_ENDPOINT = 'https://us.market-api.kaiko.io/v2/data/trades.v1'
export const DEFAULT_WS_API_ENDPOINT = 'wss://us.market-ws.kaiko.io/v2/rpc'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  config.api.headers['X-Api-Key'] = config.apiKey
  return config
}
