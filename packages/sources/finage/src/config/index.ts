import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'

export const NAME = 'FINAGE'

export const DEFAULT_BASE_URL = 'https://api.finage.co.uk'
export const DEFAULT_STOCK_WS_API_ENDPOINT = 'wss://e4s39ar3mr.finage.ws:7002'
export const DEFAULT_FOREX_WS_API_ENDPOINT = 'wss://w29hxx2ndd.finage.ws:8001'
export const DEFAULT_CRYPTO_WS_API_ENDPOINT = 'wss://e3tne9d5zq.finage.ws:6014'
export const DEFAULT_ENDPOINT = 'stock'

export const ENV_STOCK_WS_API_ENDPOINT = 'STOCK_WS_API_ENDPOINT'
export const ENV_FOREX_WS_API_ENDPOINT = 'FOREX_WS_API_ENDPOINT'
export const ENV_CRYPTO_WS_API_ENDPOINT = 'CRYPTO_WS_API_ENDPOINT'

export type Config = BaseConfig & {
  stockWsEndpoint: string
  forexWsEndpoint: string
  cryptoWsEndpoint: string
}

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  const stockWsUrl = util.getEnv(ENV_STOCK_WS_API_ENDPOINT) || DEFAULT_STOCK_WS_API_ENDPOINT
  const forexWsUrl = util.getEnv(ENV_FOREX_WS_API_ENDPOINT) || DEFAULT_FOREX_WS_API_ENDPOINT
  const cryptoWsUrl = util.getEnv(ENV_CRYPTO_WS_API_ENDPOINT) || DEFAULT_CRYPTO_WS_API_ENDPOINT
  const socketKey = util.getEnv('WS_SOCKET_KEY')
  return {
    ...config,
    api: {
      ...config.api,
      baseURL: config.api.baseURL || DEFAULT_BASE_URL,
    },
    stockWsEndpoint: `${stockWsUrl}?token=${socketKey}`,
    forexWsEndpoint: `${forexWsUrl}?token=${socketKey}`,
    cryptoWsEndpoint: `${cryptoWsUrl}?token=${socketKey}`,
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
