import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'DEFI_DOZEN'
export const DEFAULT_ENDPOINT = 'allocation'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
