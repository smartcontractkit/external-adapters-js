import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'DEFI_DOZEN'

export const makeConfig = (prefix?: string): Config => {
  return Requester.getDefaultConfig(prefix)
}
