import { logger } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

export const ENV_API_KEY = 'API_KEY'

export type Config = {
  password: string
}

export const getConfig = (prefix = ''): Config => {
  return {
    password: util.getRandomRequiredEnv(ENV_API_KEY, prefix),
  }
}

export const logConfig = (config: Config): void => {
  logger.debug('Adapter configuration:', { config })
}
