import { util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const ENV_API_ENDPOINT = 'API_ENDPOINT'

export const makeConfig = (prefix = ''): Config => ({
  returnRejectedPromiseOnError: true,
  api: {
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
