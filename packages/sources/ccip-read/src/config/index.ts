import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/ea-bootstrap'

export const NAME = 'CCIP_READ'

export const DEFAULT_ENDPOINT = 'optimism-metis-gateway'
export const ENV_RPC_URL = 'RPC_URL'
export const ENV_L2_RPC_URL = 'L2_RPC_URL'
export const ENV_CHAIN_ID = 'CHAIN_ID'
export const ENV_L2_CHAIN_ID = 'L2_CHAIN_ID'
export const DEFAULT_CHAIN_ID = '1'

export interface Config extends BaseConfig {
  l2RpcUrl?: string
  l2ChainId?: string | number
  addressManagerContract?: string
}

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    rpcUrl: util.getRequiredEnv(ENV_RPC_URL, prefix),
    chainId: parseInt(util.getEnv(ENV_CHAIN_ID) || DEFAULT_CHAIN_ID) || util.getEnv(ENV_CHAIN_ID),
    l2RpcUrl: util.getEnv(ENV_L2_RPC_URL, prefix),
    l2ChainId:
      parseInt(util.getEnv(ENV_L2_CHAIN_ID) || DEFAULT_CHAIN_ID) || util.getEnv(ENV_L2_CHAIN_ID),
    addressManagerContract: util.getEnv('ADDRESS_MANAGER_CONTRACT', prefix),
  }
}
