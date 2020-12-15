import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const ENDPOINT_MAIN = 'https://sochain.com'

export const DEFAULT_ENDPOINT = 'balance'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = ENDPOINT_MAIN
  return config
}
