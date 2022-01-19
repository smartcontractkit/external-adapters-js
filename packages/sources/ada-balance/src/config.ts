import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'

export const NAME = 'ADA_BALANCE'

export const DEFAULT_ENDPOINT = 'balance'
export const DEFAULT_PORT = 1337

export interface ExtendedConfig extends BaseConfig {
  httpOgmiosURL?: string
  wsOgmiosURL?: string
  isTLSEnabled?: boolean
  host?: string
  port: number
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const baseConfig = Requester.getDefaultConfig(prefix)
  baseConfig.defaultEndpoint = DEFAULT_ENDPOINT
  const rpcPort = util.getEnv('RPC_PORT', prefix)
  return {
    ...baseConfig,
    httpOgmiosURL: util.getEnv('HTTP_OGMIOS_URL', prefix),
    wsOgmiosURL: util.getEnv('WS_OGMIOS_URL', prefix),
    host: util.getEnv('WS_API_ENDPOINT', prefix),
    port: rpcPort ? parseInt(rpcPort) : DEFAULT_PORT,
    isTLSEnabled: !!util.getEnv('IS_TLS_ENABLED', prefix),
  }
}
