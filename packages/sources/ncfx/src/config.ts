import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'NCFX' // This should be filled in with a name corresponding to the data provider using UPPERCASE and _underscores_.

export const DEFAULT_ENDPOINT = 'example'
export const DEFAULT_BASE_URL = 'http://localhost:18081'
export const DEFAULT_BASE_WS_URL = 'wss://feed.newchangefx.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.api.baseWebsocketURL = config.api.baseWebsocketURL || DEFAULT_BASE_WS_URL

  const username = util.getRequiredEnv('API_USERNAME', prefix) || ''
  const password = util.getRequiredEnv('API_PASSWORD', prefix) || ''
  config.api.auth = { username, password }

  return config
}
