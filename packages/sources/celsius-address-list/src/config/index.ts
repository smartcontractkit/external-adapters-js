import { Requester, util, Config } from '@chainlink/ea-bootstrap'

export const NAME = 'CELSIUS_ADDRESS_LIST'

export const DEFAULT_ENDPOINT = 'wallet'
export const ENV_RPC_URL = 'RPC_URL'
export const ENV_CHAIN_ID = 'CHAIN_ID'
export const DEFAULT_CHAIN_ID = '1'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.rpcUrl = util.getRequiredEnv(ENV_RPC_URL)
  config.chainId =
    parseInt(util.getEnv(ENV_CHAIN_ID) || DEFAULT_CHAIN_ID) || util.getEnv(ENV_CHAIN_ID)
  return config
}
