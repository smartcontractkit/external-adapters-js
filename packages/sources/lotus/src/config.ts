import { HTTP } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'LOTUS'

export const DEFAULT_ENDPOINT = 'balance'

export const makeConfig = (prefix?: string): Config => {
  const config = HTTP.getDefaultConfig(prefix, true)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
