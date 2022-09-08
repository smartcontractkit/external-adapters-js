import { Requester, util } from '@chainlink/ea-bootstrap'
import type { Config as BaseConfig } from '@chainlink/ea-bootstrap'

export type Config = BaseConfig & {
  rpcUrl: string
}
export const ENV_ETHEREUM_CHAIN_ID = 'ETHEREUM_CHAIN_ID'
export const ENV_FALLBACK_CHAIN_ID = 'CHAIN_ID'
export const DEFAULT_CHAIN_ID = '1'

export const DEFAULT_ENDPOINT = 'price'
export const NAME = 'CURVE_3POOL'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    rpcUrl: util.getRequiredEnvWithFallback('ETHEREUM_RPC_URL', ['RPC_URL'], prefix),
    chainId:
      parseInt(
        util.getEnvWithFallback(ENV_ETHEREUM_CHAIN_ID, [ENV_FALLBACK_CHAIN_ID]) || DEFAULT_CHAIN_ID,
      ) || util.getEnvWithFallback(ENV_ETHEREUM_CHAIN_ID, [ENV_FALLBACK_CHAIN_ID]),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
