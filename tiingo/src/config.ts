import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'iex'
export const DEFAULT_BASE_URL = 'https://api.tiingo.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseUrl || DEFAULT_BASE_URL,
  }
  return config
}
