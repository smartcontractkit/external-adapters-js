import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'MEDIANIZER'

export const makeConfig = (prefix = ''): Config => {
  return Requester.getDefaultConfig(prefix)
}
