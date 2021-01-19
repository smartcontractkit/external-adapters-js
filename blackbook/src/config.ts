import { Requester, logger } from '@chainlink/external-adapter'
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
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || 'https://service.blackbookcloud.com/'
  return {
    ...config,
    username: util.getRequiredEnv(ENV_API_USERNAME),
    password: util.getRequiredEnv(ENV_API_PASSWORD),
  }
}

// Config without sensitive data
const redact = (config: Config) => ({
  ...config,
  apiKey: '*****',
  username: '*****',
  password: '*****',
})

export function logConfig(config: Config): void {
  logger.debug('Adapter configuration:', { config: config && redact(config) })
}
