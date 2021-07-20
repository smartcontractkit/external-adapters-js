import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'EODHISTORICALDATA'

export const DEFAULT_ENDPOINT = 'stock'
export const DEFAULT_API_ENDPOINT = 'https://eodhistoricaldata.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_API_ENDPOINT,
    params: { api_token: config.apiKey },
  }
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
