import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'

export const NAME = 'ADA_BALANCE'

export const DEFAULT_ENDPOINT = 'balance'
export const DEFAULT_RPC_PORT = 1337

export interface ExtendedConfig extends BaseConfig {
  isTLSEnabled: boolean
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const baseConfig = Requester.getDefaultConfig(prefix)
  baseConfig.api.baseWsUrl = util.getRequiredEnv('WS_API_ENDPOINT', prefix)
  const port = util.getEnv('RPC_PORT', prefix)
  baseConfig.rpcPort = port ? parseInt(port) : DEFAULT_RPC_PORT
  baseConfig.defaultEndpoint = DEFAULT_ENDPOINT
  return {
    ...baseConfig,
    isTLSEnabled: !!util.getEnv('IS_TLS_ENABLED', prefix),
  }
}
