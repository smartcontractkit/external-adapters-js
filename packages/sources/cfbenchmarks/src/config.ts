import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'CFBENCHMARKS'

export const AUTHORIZATION_HEADER = 'Authorization'

export const ENV_API_USERNAME = 'API_USERNAME'
export const ENV_API_PASSWORD = 'API_PASSWORD'

export const DEFAULT_ENDPOINT = 'values'
export const DEFAULT_API_ENDPOINT = 'https://oracleprod1.cfbenchmarks.com/api'
export const DEFAULT_WS_API_ENDPOINT = 'wss://www.cfbenchmarks.com/ws/v4'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  config.api.baseWsURL = config.api.baseWsURL || DEFAULT_WS_API_ENDPOINT

  const username = util.getRequiredEnv(ENV_API_USERNAME, prefix)
  const password = util.getRequiredEnv(ENV_API_PASSWORD, prefix)
  const encodedCreds = Buffer.from(`${username}:${password}`).toString('base64')
  config.api.headers[AUTHORIZATION_HEADER] = `Basic ${encodedCreds}`

  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
