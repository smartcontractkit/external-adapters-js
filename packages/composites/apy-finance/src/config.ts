import { Requester, util } from '@chainlink/ea-bootstrap'
import * as types from '@chainlink/types'

export type Config = types.Config & {
  rpcUrl: string
  registryAddr: string
}

export const DEFAULT_ENDPOINT = 'tvl'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    rpcUrl: util.getRequiredEnv('RPC_URL'),
    registryAddr: util.getRequiredEnv('REGISTRY_ADDRESS'),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
