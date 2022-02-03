import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const DEFAULT_API_ENDPOINT = 'http://localhost:8000/api/oracle'

// This environment variable is needed for the Hack the Orb oracle
// instructions to remain correct.
const LEGACY_API_ENDPOINT_ENV = 'AG_SOLO_ORACLE_URL'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL =
    config.api.baseURL || util.getEnv(LEGACY_API_ENDPOINT_ENV) || DEFAULT_API_ENDPOINT
  config.apiKey = config.apiKey || 'not required'
  return config
}
