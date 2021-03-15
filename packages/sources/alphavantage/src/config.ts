import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const NAME = 'ALPHAVANTAGE'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_API_ENDPOINT = 'https://www.alphavantage.co/query'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_API_ENDPOINT,
    params: {
      apikey: config.apiKey,
    },
  }
  return config
}
