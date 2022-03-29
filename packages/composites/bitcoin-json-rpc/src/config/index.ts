import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'getblockchaininfo'
export const DEFAULT_BITCOIN_RPC_URL = 'http://localhost:8332'
export const NAME = 'BITCOIN_JSON_RPC'

export interface ExtendedConfig extends Config {
  RPC_URL: string
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const RPC_URL = util.getEnv('BITCOIN_RPC_URL', prefix)
  const RPC_URL_FALLBACK = util.getEnv('RPC_URL', prefix)
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    RPC_URL: RPC_URL || RPC_URL_FALLBACK || DEFAULT_BITCOIN_RPC_URL,
  }
}
