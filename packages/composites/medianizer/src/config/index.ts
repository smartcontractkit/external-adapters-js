import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'MEDIANIZER'
export const DEFAULT_ENDPOINT = 'medianizer'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
