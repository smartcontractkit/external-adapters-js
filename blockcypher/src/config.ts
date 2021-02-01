import { Requester } from '@chainlink/external-adapter'
import types from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const DEFAULT_ENDPOINT = 'balance'

export const ENV_REQUEST_THROTTLE = 'API_THROTTLE'

export type Config = types.Config & {
  throttle: number
}

export const makeConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig(prefix)
  const throttle = util.getEnv(ENV_REQUEST_THROTTLE, prefix)
  if (throttle) config.throttle = Number(throttle)
  return config
}
