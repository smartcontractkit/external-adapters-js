import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'

export const NAME = 'SOLANA_VIEW_FUNCTION'

export const DEFAULT_ENDPOINT = 'accounts'

export const DEFAULT_CONNECTION_COMMITMENT = 'confirmed'

export interface ExtendedConfig extends BaseConfig {
  commitment: string
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  return {
    ...Requester.getDefaultConfig(prefix),
    rpcUrl: util.getRequiredEnv('LCD_URL', prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    commitment: util.getEnv('COMMITMENT', prefix) || DEFAULT_CONNECTION_COMMITMENT,
  }
}
