import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_API_ENDPOINT = 'https://api.finage.co.uk/last/'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  config.api.params = { apikey: config.apiKey }
  return config
}
