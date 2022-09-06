import { Requester, util } from '@chainlink/ea-bootstrap'
import type { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'POR_ADDRESS_LIST'
export const ENV_RPC_URL = 'RPC_URL'
export const ENV_CHAIN_ID = 'CHAIN_ID'
export const DEFAULT_CHAIN_ID = '1'
export const DEFAULT_ENDPOINT = 'address'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  config.rpcUrl = util.getRequiredEnv(ENV_RPC_URL)
  config.chainId =
    parseInt(util.getEnv(ENV_CHAIN_ID) || DEFAULT_CHAIN_ID) || util.getEnv(ENV_CHAIN_ID)
  return config
}
