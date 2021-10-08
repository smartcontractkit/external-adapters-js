import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'FINAGE'

export const DEFAULT_BASE_URL = 'https://api.finage.co.uk'
export const DEFAULT_WS_API_ENDPOINT = 'wss://e4s39ar3mr.finage.ws:7002'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  const wsUrl = config.api.baseWsURL || DEFAULT_WS_API_ENDPOINT
  const socketKey = util.getEnv('WS_SOCKET_KEY')
  config.api.baseWsURL = `${wsUrl}?token=${socketKey}`
  return config
}
