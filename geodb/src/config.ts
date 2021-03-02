import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'matches'
export const DEFAULT_BASE_URL = 'http://34.122.58.34:8000/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api = {
    ...config.api,
    baseURL: config.api.baseUrl || DEFAULT_BASE_URL,
  }
  return config
}
