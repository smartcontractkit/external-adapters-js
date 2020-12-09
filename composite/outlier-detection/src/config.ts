import { logger } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const ENV_CHECK_THRESHOLD = 'CHECK_THRESHOLD'
export const ENV_ONCHAIN_THRESHOLD = 'ONCHAIN_THRESHOLD'

export const makeConfig = (prefix = ''): Config => {
  return {
    threshold: {
      checks: parseInt(util.getEnv(ENV_CHECK_THRESHOLD, prefix) || 0),
      onchain: parseInt(util.getEnv(ENV_ONCHAIN_THRESHOLD, prefix) || 0),
    },
  }
}

export const logConfig = (config: Config): void => {
  logger.debug('Adapter configuration:', { config })
}
