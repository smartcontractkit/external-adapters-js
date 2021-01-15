import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import types from '@chainlink/types'
import { NAME } from './endpoint/vehicle'

const ENV_API_USERNAME = 'API_USERNAME'
const ENV_API_PASSWORD = 'API_PASSWORD'

export const DEFAULT_ENDPOINT = NAME

export type Config = types.Config & {
  username: string
  password: string
}

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    username: util.getRequiredEnv(ENV_API_USERNAME),
    password: util.getRequiredEnv(ENV_API_PASSWORD),
  }
}
