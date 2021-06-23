import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'CFBENCHMARKS'

export const DEFAULT_ENDPOINT = 'values'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || 'https://oracleprod1.cfbenchmarks.com/api'
  config.api.auth = {
    username: util.getEnv('API_USERNAME', prefix) || '',
    password: util.getEnv('API_PASSWORD', prefix) || '',
  }
  config.DEFAULT_ENDPOINT = DEFAULT_ENDPOINT
  return config
}
