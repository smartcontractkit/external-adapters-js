import { Config as BaseConfig, Requester } from '@chainlink/ea-bootstrap'

export const NAME = 'EXAMPLE_COMPOSITE'
export const DEFAULT_ENDPOINT = 'example'

export type Config = BaseConfig & {
  // Adapter specific configs
}

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
