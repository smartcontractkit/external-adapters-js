import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'EXPERT_CAR_BROKER'

export const DEFAULT_ENDPOINT = 'feed'
export const DEFAULT_BASE_URL = 'https://prices.expertcarbroker.workers.dev/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  return config
}
