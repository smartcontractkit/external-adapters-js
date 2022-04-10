import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'DEFI_PULSE'
export const DEFAULT_ENDPOINT = 'allocation'
export const DEFAULT_RPC_URL = 'http://localhost:8545'
export const DEFAULT_NETWORK = 'mainnet'
export interface ExtendedConfig extends Config {
  RPC_URL?: string
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const RPC_URL = util.getRequiredEnvWithFallback('ETHEREUM_RPC_URL', ['RPC_URL'])
  return {
    ...Requester.getDefaultConfig(prefix),
    RPC_URL: RPC_URL || DEFAULT_RPC_URL,
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
