import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'CIRCUIT_BREAKER'
export const DEFAULT_ENDPOINT = 'circuit'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
