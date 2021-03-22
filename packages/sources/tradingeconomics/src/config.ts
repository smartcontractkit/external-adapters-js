import { Requester } from '@chainlink/external-adapter'
import { Config as BaseConfig } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const DEFAULT_ENDPOINT = 'markets'
export const DEFAULT_BASE_URL = 'https://api.tradingeconomics.com'

const DEFAULT_WS_TIMEOUT = 5000

export type Config = BaseConfig & {
  wsTimeout: number
  apiClientKey: string
}

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix) as Config
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL

  config.wsTimeout = Number(util.getEnv('WS_TIMEOUT')) || DEFAULT_WS_TIMEOUT

  const CLIENT_KEY = util.getRequiredEnv('API_CLIENT_KEY')
  config.apiClientKey = CLIENT_KEY
  const CLIENT_SECRET = util.getRequiredEnv('API_CLIENT_SECRET')
  config.apiKey = CLIENT_SECRET

  config.api.params = {
    c: `${CLIENT_KEY}:${CLIENT_SECRET}`,
  }

  return config
}
