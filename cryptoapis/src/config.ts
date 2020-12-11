import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const ENDPOINT_MAIN = 'https://api.cryptoapis.io'

export const DEFAULT_DATA_PATH = 'addresses'
export const DEFAULT_TIMEOUT = 30000
export const DEFAULT_CONFIRMATIONS = 6
export const DEFAULT_ENDPOINT = 'price'

export const getBaseURL = (): string => ENDPOINT_MAIN

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.headers['X-API-Key'] = config.apiKey
  return config
}
