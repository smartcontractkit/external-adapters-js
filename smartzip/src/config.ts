// import { Requester } from '@chainlink/ea-bootstrap'
import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const NAME = 'SMARTZIP'
export const DEFAULT_BASE_URL = 'https://data-api.smartzip-services.com/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  return config
}
