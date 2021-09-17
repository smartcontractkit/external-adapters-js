import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'ONCHAIN_GAS' // This should be filled in with a name corresponding to the data provider using UPPERCASE and _underscores_.

export const DEFAULT_ENDPOINT = 'gas'
export const DEAFULT_NUM_BLOCKS = 1
export const MAX_BLOCKS_TO_QUERY = 10

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = util.getRequiredEnv('WS_RPC_URL', prefix)
  config.rpcUrl = util.getRequiredEnv('RPC_URL', prefix)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
