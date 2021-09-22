import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'NCFX'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_BASE_URL = 'http://localhost:18081'
export const DEFAULT_BASE_WS_URL = 'wss://feed.newchangefx.com'
export const FOREX_DEFAULT_BASE_WS_URL = 'wss://ws-spot.newchangefx.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.api.baseWebsocketURL = config.api.baseWebsocketURL || DEFAULT_BASE_WS_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  const username = util.getRequiredEnv('API_USERNAME', prefix) || ''
  const password = util.getRequiredEnv('API_PASSWORD', prefix) || ''
  config.api.auth = { username, password }
  config.adapterSpecificParams = {
    forexWSUsername: util.getRequiredEnv('FOREX_WS_USERNAME', prefix) || '',
    forexWSPassword: util.getRequiredEnv('FOREX_WS_PASSWORD', prefix) || '',
    forexDefaultBaseWSUrl: FOREX_DEFAULT_BASE_WS_URL,
  }
  return config
}
