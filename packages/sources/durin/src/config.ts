import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'

export const NAME = 'DURIN'

export const DEFAULT_ENDPOINT = 'optimism-gateway'

export interface Config extends BaseConfig {
  l2RpcUrl?: string
  addressManagerContract?: string
}

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    rpcUrl: util.getRequiredEnv('RPC_URL', prefix),
    l2RpcUrl: util.getEnv('L2_RPC_URL', prefix),
    addressManagerContract: util.getEnv('ADDRESS_MANAGER_CONTRACT', prefix),
  }
}
