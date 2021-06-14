import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'AMBERDATA'

export const DEFAULT_API_ENDPOINT = 'https://web3api.io'
export const DEFAULT_WS_API_ENDPOINT = 'wss://ws.web3api.io'

const DEFAULT_ENDPOINT = 'price'

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.headers['x-api-key'] = config.apiKey
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  config.DEFAULT_ENDPOINT = DEFAULT_ENDPOINT
  return config
}
