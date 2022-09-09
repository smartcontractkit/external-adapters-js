import { Requester, util } from '@chainlink/ea-bootstrap'
import type { Config } from '@chainlink/ea-bootstrap'

export const DEFAULT_ENDPOINT = 'format'
export const NAME = 'BOB'
export const ENV_RPC_URL = 'RPC_URL'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    rpcUrl: util.getRandomRequiredEnv(ENV_RPC_URL, prefix),
  }
}
