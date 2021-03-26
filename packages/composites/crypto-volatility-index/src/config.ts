import { util, Requester } from '@chainlink/ea-bootstrap'
import { NAME } from '@chainlink/token-allocation-adapter'
import { RequestConfig } from '@chainlink/types'

export type Config = {
  taConfig: RequestConfig
}

export const DEFAULT_MULTIPLY = 1000000
export const DEFAULT_HEARTBEAT = 60

export const makeConfig = (prefix = ''): Config => {
  const defaultConfig = Requester.getDefaultConfig(prefix)
  defaultConfig.api.baseURL = util.getRequiredEnv(`${NAME}_DATA_PROVIDER_URL`)
  defaultConfig.api.method = 'post'
  return {
    taConfig: defaultConfig.api,
  }
}
