import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_API_ENDPOINT = 'https://api.blockchair.com'

export const DEFAULT_ENDPOINT = 'difficulty'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  return config
}
