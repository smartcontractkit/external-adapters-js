import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const NAME = 'FIXER'

export const DEFAULT_ENDPOINT = 'convert'
export const DEFAULT_API_ENDPOINT = 'https://data.fixer.io'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseUrl || DEFAULT_API_ENDPOINT,
    params: {
      access_key: config.apiKey,
    },
  }
  return config
}
