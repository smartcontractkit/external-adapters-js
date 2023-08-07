import { Requester } from '@chainlink/ea-bootstrap'

export const DEFAULT_NETWORK = 'ETHEREUM'
export const NAME = 'REFERENCE_TRANSFORM'
export const DEFAULT_ENDPOINT = 'transform'

export type Config = {
  defaultEndpoint: string
  prefix: string
}

export const makeConfig = (prefix = ''): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    prefix,
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
