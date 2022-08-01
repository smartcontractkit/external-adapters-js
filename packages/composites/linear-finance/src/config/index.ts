import { Config } from '@chainlink/ea-bootstrap'
import { Requester, util } from '@chainlink/ea-bootstrap'

export const NAME = 'LINEAR_FINANCE'
export const DEFAULT_ENDPOINT = 'prices'
export const DEFAULT_API_ENDPOINT = 'https://pro-api.xangle.io'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: util.getEnv('DEFAULT_ENDPOINT') || DEFAULT_ENDPOINT,
    api: {
      baseURL: util.getEnv('API_ENDPOINT') || DEFAULT_API_ENDPOINT,
      headers: {
        'X-XANGLE_API_KEY': util.getRequiredEnv('API_KEY'),
      },
    },
  }
}
