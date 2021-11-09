import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'

export const NAME = 'DURIN'

export const DEFAULT_ENDPOINT = 'gateway'
export const DEFAULT_BASE_URL = 'http://localhost:18081'

export interface Config extends BaseConfig {
  l2RpcUrl: string
  addressManagerContract: string
}

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  config.rpcUrl = util.getRequiredEnv('RPC_URL')
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    rpcUrl: util.getRequiredEnv('RPC_URL', prefix),
    l2RpcUrl: util.getRequiredEnv('L2_RPC_URL', prefix),
    addressManagerContract: util.getRequiredEnv('ADDRESS_MANAGER_CONTRACT', prefix),
  }
}
