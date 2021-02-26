import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'quote'
export const DEFAULT_API_ENDPOINT = 'https://fmpcloud.io'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api?.baseURL || DEFAULT_API_ENDPOINT,
    params: {
      apikey: config.apiKey,
    },
  }
  return config
}
