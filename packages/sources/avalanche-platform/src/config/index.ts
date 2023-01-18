import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'AVALANCHE_PLATFORM'

export const DEFAULT_ENDPOINT = 'balance'
export const ENV_P_CHAIN_RPC_URL = 'P_CHAIN_RPC_URL'

export const makeConfig = (prefix?: string): Config => {
  const rpcURL = util.getRequiredEnv(ENV_P_CHAIN_RPC_URL, prefix)
  const defaultConfig = Requester.getDefaultConfig(prefix)
  return {
    ...defaultConfig,
    api: {
      ...defaultConfig.api,
      baseURL: rpcURL,
    },
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
