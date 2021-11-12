import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'ALPINE' // This should be filled in with a name corresponding to the data provider using UPPERCASE and _underscores_.

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)

  config.rpcUrl = util.getRequiredEnv('RPC_URL', prefix)
  config.defaultEndpoint = 'tvl'
  return config
}
