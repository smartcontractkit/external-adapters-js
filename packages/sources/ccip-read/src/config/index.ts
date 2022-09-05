import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/ea-bootstrap'

export const NAME = 'CCIP_READ'

export const DEFAULT_ENDPOINT = 'optimism-metis-gateway'

export interface Config extends BaseConfig {
  l2RpcUrl?: string
  l2ChainId?: string | number
  addressManagerContract?: string
}

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    rpcUrl: util.getRequiredEnv('RPC_URL', prefix),
    chainId: parseInt(util.getEnv('CHAIN_ID') || '1') || util.getEnv('CHAIN_ID'),
    l2RpcUrl: util.getEnv('L2_RPC_URL', prefix),
    l2ChainId: parseInt(util.getEnv('L2_CHAIN_ID') || '1') || util.getEnv('L2_CHAIN_ID'),
    addressManagerContract: util.getEnv('ADDRESS_MANAGER_CONTRACT', prefix),
  }
}
