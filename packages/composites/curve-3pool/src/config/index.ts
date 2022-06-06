import { Requester, util } from '@chainlink/ea-bootstrap'
import * as types from '@chainlink/types'

export type Config = types.Config & {
  rpcUrl: string
  registryAddr: string
}

export const DEFAULT_ENDPOINT = 'price'
export const NAME = 'CURVE_3POOL'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    rpcUrl: util.getRequiredEnvWithFallback('ETHEREUM_RPC_URL', ['RPC_URL'], prefix),
    registryAddr: util.getRequiredEnv('CURVE_3POOL_ADDRESS', prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
