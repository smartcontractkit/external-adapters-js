import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'CACHE_GOLD'

export const DEFAULT_ENDPOINT = 'lockedGold'
export const DEFAULT_BASE_URL = 'https://contract.cache.gold/api'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
