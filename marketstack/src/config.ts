import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_INTERVAL = '1min'
export const DEFAULT_LIMIT = 1
export const DEFAULT_ENDPOINT = 'eod'
export const DEFAULT_API_ENDPOINT = 'https://us.market-api.kaiko.io'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  return config
}
