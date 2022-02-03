import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const makeConfig = (prefix = ''): Config => {
  return Requester.getDefaultConfig(prefix)
}
