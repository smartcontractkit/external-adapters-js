import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'NCFX'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_BASE_URL = 'http://localhost:18081'
export const DEFAULT_BASE_WS_URL = 'wss://feed.newchangefx.com'
export const FOREX_DEFAULT_BASE_WS_URL =
  'wss://fiat-ws.eu-west-2.apingxelb.v1.newchangefx.com/sub/fiat/ws/ref'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.ws.baseWsURL = config.ws.baseWsURL || DEFAULT_BASE_WS_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  const username = util.getEnv('API_USERNAME', prefix) || ''
  const password = util.getEnv('API_PASSWORD', prefix) || ''
  config.api.auth = { username, password }

  const forexUsername = util.getEnv('FOREX_WS_USERNAME', prefix) || ''
  const forexPassword = util.getEnv('FOREX_WS_PASSWORD', prefix) || ''

  const forexEncodedCreds =
    forexUsername && forexPassword
      ? Buffer.from(
          JSON.stringify({
            grant_type: 'password',
            username: forexUsername,
            password: forexPassword,
          }),
        ).toString('base64')
      : ''

  config.adapterSpecificParams = {
    forexDefaultBaseWSUrl: FOREX_DEFAULT_BASE_WS_URL,
    forexEncodedCreds,
  }

  return config
}
