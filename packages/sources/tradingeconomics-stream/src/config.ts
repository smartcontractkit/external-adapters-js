import { util } from '@chainlink/ea-bootstrap'

export type Config = {
  url: string
  key: string
  secret: string
  symbols: string
  reconnectTimeout: number
}

export const makeConfig = (prefix?: string): Config => {
  return {
    url: util.getEnv('API_URL', prefix) || 'ws://stream.tradingeconomics.com/',
    key: util.getRequiredEnv('API_CLIENT_KEY', prefix),
    secret: util.getRequiredEnv('API_CLIENT_SECRET', prefix),
    symbols: util.getRequiredEnv('SYMBOLS', prefix),
    reconnectTimeout: Number(util.getEnv('RECONNECT_TIMEOUT', prefix) || 3000),
  }
}
