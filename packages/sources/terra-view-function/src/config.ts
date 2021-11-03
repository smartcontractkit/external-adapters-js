import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'

export const NAME = 'TERRA_VIEW_FUNCTION'

export const DEFAULT_ENDPOINT = 'view'

export const ENV_RPC_URL = 'RPC_URL'
export const ENV_CHAIN_ID = 'CHAIN_ID'

export type Config = BaseConfig & {
  rpcUrl: string
  chainId: string
}

export const makeConfig = (prefix?: string): Config => ({
  ...Requester.getDefaultConfig(prefix),
  rpcUrl: util.getRequiredEnv(ENV_RPC_URL, prefix),
  chainId: util.getRequiredEnv(ENV_CHAIN_ID, prefix),
  defaultEndpoint: DEFAULT_ENDPOINT,
})
