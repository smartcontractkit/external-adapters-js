import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || 'http://localhost:18081'
  config.DEFAULT_ENDPOINT = 'example'
  return config
}
