import { Config } from '@chainlink/types'
import { Requester, util } from '@chainlink/ea-bootstrap'

export const DEFAULT_ENDPOINT = 'https://pro-api.xangle.io'
export const XBCI = 'xbci'
export const XLCI = 'xlci'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    api: {
      baseURL: util.getEnv('API_ENDPOINT') || DEFAULT_ENDPOINT,
      headers: {
        'X-XANGLE_API_KEY': util.getRequiredEnv('API_KEY'),
      },
    },
  }
}
