import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'GALAXY'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_BASE_URL = 'https://test.data.galaxydigital.io/v1.0/login'
export const DEFAULT_WS_API_ENDPOINT = 'wss://prod.data.galaxydigital.io/v1.0'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT

  const apiKey = util.getRequiredEnv('WS_API_KEY', prefix)
  const apiPassword = util.getRequiredEnv('WS_API_PASSWORD', prefix)
  const WS_URL = util.getEnv('WS_API_ENDPOINT', prefix) || DEFAULT_WS_API_ENDPOINT

  config.defaultEndpoint = DEFAULT_ENDPOINT
  config.ws.baseWsURL = WS_URL
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_BASE_URL,
  }
  config.adapterSpecificParams = {
    apiKey,
    apiPassword,
  }
  return config
}
