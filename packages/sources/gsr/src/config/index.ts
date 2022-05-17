import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'GSR'
export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_BASE_URL = 'https://oracle.dev.gsr.io/v1'
export const DEFAULT_WS_API_ENDPOINT = 'wss://oracle.dev.gsr.io/oracle'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  const userId = util.getRequiredEnv('WS_USER_ID', prefix)
  const publicKey = util.getRequiredEnv('WS_PUBLIC_KEY', prefix)
  const privateKey = util.getRequiredEnv('WS_PRIVATE_KEY', prefix)
  const WS_URL = util.getEnv('WS_API_ENDPOINT', prefix) || DEFAULT_WS_API_ENDPOINT
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_BASE_URL,
    baseWsURL: WS_URL,
    headers: {
      'x-auth-userid': userId,
    },
  }
  config.adapterSpecificParams = {
    userId,
    publicKey,
    privateKey,
  }
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
