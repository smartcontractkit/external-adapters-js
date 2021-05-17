import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as config } from '@chainlink/types'

export type Config = config & {
  client: {
    key: string
    secret: string
  }
}

export const NAME = 'TRADINGECONOMICS'

export const DEFAULT_API_ENDPOINT = 'https://api.tradingeconomics.com/markets'
export const DEFAULT_WS_API_ENDPOINT = 'ws://stream.tradingeconomics.com/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT

  return {
    ...config,
    client: {
      key: util.getRequiredEnv('API_CLIENT_KEY', prefix),
      secret: util.getRequiredEnv('API_CLIENT_SECRET', prefix),
    },
  }
}
