import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'eod'
export const DEFAULT_BASE_URL = 'https://api.tiingo.com/tiingo/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api = {
    ...config.api,
    baseURL: config.api.baseUrl || DEFAULT_BASE_URL,
    params: {
      token: config.apiKey,
    },
  }
  return config
}
