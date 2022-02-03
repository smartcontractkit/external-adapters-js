import { Requester, util } from '@chainlink/ea-bootstrap'
import * as types from '@chainlink/types'

export type Config = types.Config & {
  rpcUrl: string
  registryAddr: string
}

export const DEFAULT_ENDPOINT = 'tvl'
export const NAME = 'APY_FINANCE'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    rpcUrl: util.getRequiredEnvWithFallback('ETHEREUM_RPC_URL', ['RPC_URL'], prefix),
    registryAddr: util.getRequiredEnv('REGISTRY_ADDRESS', prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
