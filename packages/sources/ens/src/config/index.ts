import { Requester, util } from '@chainlink/ea-bootstrap'
import type { Config, EnvDefaultOverrides } from '@chainlink/ea-bootstrap'

export const NAME = 'ENS'
export const ENV_RPC_URL = 'RPC_URL'
export const ENV_CHAIN_ID = 'CHAIN_ID'
export const DEFAULT_CHAIN_ID = '1'

export const DEFAULT_ENDPOINT = 'lookup'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  config.rpcUrl = util.getRequiredEnv(ENV_RPC_URL)
  config.chainId =
    parseInt(util.getEnv(ENV_CHAIN_ID) || DEFAULT_CHAIN_ID) || util.getEnv(ENV_CHAIN_ID)
  return config
}

export const envDefaultOverrides = {
  WARMUP_ENABLED: 'false' as EnvDefaultOverrides['WARMUP_ENABLED'],
}
