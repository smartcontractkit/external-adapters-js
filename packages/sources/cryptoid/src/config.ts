import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'CRYPTO_ID'

export const DEFAULT_ENDPOINT = 'difficulty'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
