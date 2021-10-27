import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'ADA_BALANCE'

export const DEFAULT_ENDPOINT = 'balance'
export const DEFAULT_RPC_PORT = 1337

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseWsUrl = util.getRequiredEnv('WS_API_ENDPOINT')
  const port = util.getEnv('RPC_PORT', prefix)
  config.rpcPort = port ? parseInt(port) : DEFAULT_RPC_PORT
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
