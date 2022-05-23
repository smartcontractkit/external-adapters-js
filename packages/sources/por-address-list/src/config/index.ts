import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'POR_ADDRESS_LIST'

export const DEFAULT_ENDPOINT = 'address'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  config.rpcUrl = util.getRequiredEnv('RPC_URL')
  return config
}
