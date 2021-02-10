import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'gasprice'
export const DEFAULT_API_ENDPOINT = 'https://data-api.defipulse.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseUrl || DEFAULT_API_ENDPOINT,
    params: {
      'api-key': config.apiKey,
    },
  }
  return config
}
