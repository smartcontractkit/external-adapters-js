import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export interface ExtendedConfig extends Config {
  RPC_URL?: string
}

export const DEFAULT_BASE_URL = 'http://localhost:8545'

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const RPC_URL = util.getEnv('RPC_URL', prefix)
  return {
    ...Requester.getDefaultConfig(prefix),
    RPC_URL,
  }
}
