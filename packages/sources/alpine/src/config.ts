import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'ALPINE'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.network = 'ETHEREUM'
  config.defaultEndpoint = 'tvl'
  return config
}
