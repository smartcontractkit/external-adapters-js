import { Requester, util, Config } from '@chainlink/ea-bootstrap'

export const NAME = 'CELSIUS_ADDRESS_LIST'

export const DEFAULT_ENDPOINT = 'wallet'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.rpcUrl = util.getRequiredEnv('RPC_URL')
  config.chainId = parseInt(util.getEnv('CHAIN_ID') || '1') || util.getEnv('CHAIN_ID')
  return config
}
