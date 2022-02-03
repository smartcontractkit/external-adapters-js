import { HTTP } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'XBTO'

export const DEFAULT_ENDPOINT = 'price'

export const makeConfig = (prefix?: string): Config => {
  const config = HTTP.getDefaultConfig(prefix, true)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
