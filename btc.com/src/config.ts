import { Requester } from '@chainlink/external-adapter'
import types from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const DEFAULT_API_ENDPOINT = 'https://chain.api.btc.com'

export const DEFAULT_ENDPOINT = 'balance'

export type Config = types.Config & {
  apiSecret: string
}

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  config.apiSecret = util.getRequiredEnv('API_SECRET', prefix)
  config.apiKey = util.getRequiredEnv('API_KEY', prefix)
  return config
}
