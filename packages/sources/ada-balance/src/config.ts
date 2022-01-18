import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'

export const NAME = 'ADA_BALANCE'

export const DEFAULT_ENDPOINT = 'balance'

export interface ExtendedConfig extends BaseConfig {
  httpOgmiosURL: string
  wsOgmiosURL: string
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const baseConfig = Requester.getDefaultConfig(prefix)
  baseConfig.defaultEndpoint = DEFAULT_ENDPOINT
  return {
    ...baseConfig,
    httpOgmiosURL: util.getRequiredEnv('HTTP_OGMIOS_URL', prefix),
    wsOgmiosURL: util.getRequiredEnv('WS_OGMIOS_URL', prefix),
  }
}
