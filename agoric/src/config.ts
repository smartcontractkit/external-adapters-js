import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const DEFAULT_API_ENDPOINT = 'http://localhost:8000/api/oracle'
const LEGACY_API_ENDPOINT_ENV = 'AG_SOLO_ORACLE'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL =
    config.api.baseURL || util.getEnv(LEGACY_API_ENDPOINT_ENV) || DEFAULT_API_ENDPOINT
  config.apiKey = config.apiKey || 'not required'
  return config
}
