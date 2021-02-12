import { Requester } from '@chainlink/external-adapter'
import types from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const DEFAULT_ENDPOINT = 'balance'

export const ENV_RATE_LIMIT = 'API_RATE_LIMIT'

export type Config = types.Config & {
  ratelimit: number
}

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  const ratelimit = util.getEnv(ENV_RATE_LIMIT, prefix)
  if (ratelimit) config.ratelimit = Number(ratelimit)
  return config
}
