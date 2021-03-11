import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const NAME = 'DXFEED'

export const DEFAULT_ENDPOINT = 'price'
export const DEMO_ENDPOINT = 'https://tools.dxfeed.com/webservice/rest'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEMO_ENDPOINT
  if (config.api.baseURL === DEMO_ENDPOINT)
    console.warn(`Using demo endpoint: ${DEMO_ENDPOINT} (Please do not use in production!)`)

  const username = util.getEnv('API_USERNAME', prefix) || ''
  const password = util.getEnv('API_PASSWORD', prefix) || ''
  if (username.length > 0 || password.length > 0) {
    config.api.auth = { username, password }
  }

  return config
}
