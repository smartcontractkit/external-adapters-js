import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'CHAIN_RESERVE_WALLET'

export const DEFAULT_ENDPOINT = 'wallet'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.rpcUrl = util.getRequiredEnv('RPC_URL')
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
