import { Requester, util } from '@chainlink/ea-bootstrap'
import type { Config as BaseConfig } from '@chainlink/ea-bootstrap'

export type Config = BaseConfig & {
  rpcUrl: string
}

export const DEFAULT_ENDPOINT = 'price'
export const NAME = 'CURVE_3POOL'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    rpcUrl: util.getRequiredEnvWithFallback('ETHEREUM_RPC_URL', ['RPC_URL'], prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
