import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'BLOCKCHAIR'

export const DEFAULT_BASE_URL = 'https://api.blockchair.com'
export const DEFAULT_ENDPOINT = 'difficulty'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  return config
}
