import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'

export const NAME = 'SOLANA_VIEW_FUNCTION' // This should be filled in with a name corresponding to the data provider using UPPERCASE and _underscores_.

export const DEFAULT_ENDPOINT = 'accounts'

/**
 * | 'processed'
    | 'confirmed'
    | 'finalized'
    | 'recent'
    | 'single'
    | 'singleGossip'
    | 'root'
    | 'max'
 */
export const DEFAULT_CONNECTION_COMMITMENT = 'confirmed'

export interface ExtendedConfig extends BaseConfig {
  commitment: string
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  return {
    ...Requester.getDefaultConfig(prefix),
    rpcUrl: util.getRequiredEnv('RPC_URL', prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    commitment: util.getEnv('COMMITMENT', prefix) || DEFAULT_CONNECTION_COMMITMENT,
  }
}
