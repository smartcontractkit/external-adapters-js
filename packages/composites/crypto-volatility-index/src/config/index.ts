import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const DEFAULT_NETWORK = 'ETHEREUM'
export const NAME = 'CVI'
export const DEFAULT_ENDPOINT = 'volatilityIndex'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
