import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'ADA_BALANCE'

export const DEFAULT_ENDPOINT = 'balance'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseWsUrl = util.getRequiredEnv('WS_API_ENDPOINT')
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
