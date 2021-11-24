import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const makeConfig = (prefix?: string): Config => {
  return Requester.getDefaultConfig(prefix)
}
