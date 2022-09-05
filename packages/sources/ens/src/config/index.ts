import { Requester, util } from '@chainlink/ea-bootstrap'
import type { Config, EnvDefaultOverrides } from '@chainlink/ea-bootstrap'

export const NAME = 'ENS'

export const DEFAULT_ENDPOINT = 'lookup'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  config.rpcUrl = util.getRequiredEnv('RPC_URL')
  config.chainId = parseInt(util.getEnv('CHAIN_ID') || '1') || util.getEnv('CHAIN_ID')
  return config
}

export const envDefaultOverrides = {
  WARMUP_ENABLED: 'false' as EnvDefaultOverrides['WARMUP_ENABLED'],
}
