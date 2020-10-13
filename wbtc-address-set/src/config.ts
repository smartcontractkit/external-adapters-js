import { logger } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

export const ENV_API_ENDPOINT = 'API_ENDPOINT'

export type Config = {
  api: Record<string, unknown>
}

export const getConfig = (prefix = ''): Config => ({
  api: {
    returnRejectedPromiseOnError: true,
    withCredentials: true,
    timeout: 30000,
    baseURL: util.getRequiredEnv(ENV_API_ENDPOINT, prefix),
    headers: {
      common: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  },
})

export const logConfig = (config: Config): void => {
  logger.debug('Adapter configuration:', { config })
}
