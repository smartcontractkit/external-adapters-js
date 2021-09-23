import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'ONCHAIN_GAS'

export const DEFAULT_ENDPOINT = 'gas'
export const DEFAULT_NUM_BLOCKS = 1
export const DEFAULT_BLOCK_IDX = 0
export const MAX_BLOCKS_TO_QUERY = 10

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = util.getRequiredEnv('WS_RPC_URL', prefix)
  config.rpcUrl = util.getRequiredEnv('RPC_URL', prefix)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
