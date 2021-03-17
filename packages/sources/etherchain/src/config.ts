import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'gasprice'
export const DEFAULT_API_ENDPOINT = 'https://www.etherchain.org'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseUrl || DEFAULT_API_ENDPOINT
  return config
}
