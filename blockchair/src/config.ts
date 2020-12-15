import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const ENDPOINT_MAIN = 'https://api.blockchair.com'

export const DEFAULT_ENDPOINT = 'difficulty'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = ENDPOINT_MAIN
  return config
}
