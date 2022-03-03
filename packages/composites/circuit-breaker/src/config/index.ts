import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'CIRCUIT_BREAKER'

export const makeConfig = (prefix = ''): Config => {
  return Requester.getDefaultConfig(prefix)
}
