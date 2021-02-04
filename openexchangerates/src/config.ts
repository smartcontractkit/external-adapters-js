import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'latest.json'
export const DEFAULT_API_ENDPOINT = 'https://openexchangerates.org/api/'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  return config
}
