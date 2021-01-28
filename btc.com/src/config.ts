import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const DEFAULT_API_ENDPOINT = 'https://chain.api.btc.com'

export const DEFAULT_ENDPOINT = 'balance'

export type ImplConfig = Config & {
  apiSecret: string
}

export const makeConfig = (prefix = ''): ImplConfig => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  config.apiSecret = util.getEnv('API_SECRET', prefix)
  return config
}
