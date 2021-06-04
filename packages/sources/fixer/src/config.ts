import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'FIXER'

export const DEFAULT_ENDPOINT = 'convert'
export const DEFAULT_BASE_URL = 'https://data.fixer.io'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_BASE_URL,
    params: {
      access_key: config.apiKey,
    },
  }
  return config
}
