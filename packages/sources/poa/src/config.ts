import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'POA'

export const DEFAULT_BASE_URL = 'https://gasprice.poa.network/'
export const DEFAULT_ENDPOINT = 'gasprice'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT

  return config
}
