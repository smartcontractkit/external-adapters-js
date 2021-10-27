import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'ADA_BALANCE' // This should be filled in with a name corresponding to the data provider using UPPERCASE and _underscores_.

export const DEFAULT_ENDPOINT = 'balance'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseWsUrl = util.getRequiredEnv('WS_API_ENDPOINT')
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
