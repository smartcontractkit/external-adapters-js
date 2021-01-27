import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const DEFAULT_ENDPOINT = 'values'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || 'https://oracleprod1.cfbenchmarks.com/api'
  config.api.auth = {
    username: util.getRequiredEnv('API_USERNAME', prefix),
    password: util.getRequiredEnv('API_PASSWORD', prefix),
  }
  return config
}
