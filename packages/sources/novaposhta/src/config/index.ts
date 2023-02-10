import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'NOVAPOSHTA'

export const DEFAULT_ENDPOINT = 'tracking'
export const DEFAULT_BASE_URL = 'https://api.novaposhta.ua/v2.0/json/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
