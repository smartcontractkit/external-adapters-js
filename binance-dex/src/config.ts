import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_API_ENDPOINT = 'dex-asiapacific'
export const DEFAULT_DATA_ENDPOINT = 'v1/ticker/24hr'

// TODO: this usage of the process.env.API_ENDPOINT differs from most other adapters and should be changed
const getBaseURL = (region: string) => `https://${region}.binance.org`

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = getBaseURL(config.api.baseURL || DEFAULT_API_ENDPOINT)
  return config
}
