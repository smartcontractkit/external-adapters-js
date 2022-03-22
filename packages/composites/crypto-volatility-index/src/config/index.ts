import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const DEFAULT_NETWORK = 'ETHEREUM'
export const NAME = 'CRYPTO_VOLATILITY_INDEX'
export const DEFAULT_ENDPOINT = 'volatility'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
