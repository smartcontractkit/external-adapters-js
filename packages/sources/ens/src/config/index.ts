import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config, EnvDefaultOverrides } from '@chainlink/types'

export const NAME = 'ENS'

export const DEFAULT_ENDPOINT = 'lookup'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  config.rpcUrl = util.getRequiredEnv('RPC_URL')
  return config
}

export const envDefaultOverrides = {
  WARMUP_ENABLED: 'false' as EnvDefaultOverrides['WARMUP_ENABLED'],
}
