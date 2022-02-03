import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'BINANCE_DEX'
export const DEFAULT_ENDPOINT = 'price'

export const DEFAULT_API_ENDPOINT = 'dex-asiapacific'

// TODO: this usage of the process.env.API_ENDPOINT differs from most other adapters and should be changed
const getBaseURL = (region: string) => `https://${region}.binance.org`

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = getBaseURL(config.api.baseURL || DEFAULT_API_ENDPOINT)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
