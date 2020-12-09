import { logger } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const ENV_API_KEY = 'API_KEY'

export const makeConfig = (prefix = ''): Config => {
  return {
    apiKey: util.getRandomRequiredEnv(ENV_API_KEY, prefix),
  }
}

export const logConfig = (config: Config): void => {
  logger.debug('Adapter configuration:', { config })
}
