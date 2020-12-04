import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const ENV_API_KEY = 'API_KEY'
export const ENV_API_TIMEOUT = 'API_TIMEOUT'

export const ENDPOINT_MAIN = 'https://web3api.io'

export const DEFAULT_DATA_PATH = 'addresses'
export const DEFAULT_ENDPOINT = 'price'

export const getBaseURL = (): string => ENDPOINT_MAIN

export const getConfig = (prefix = ''): Config => {
  const config = Requester.getDefaultConfig()
  console.log(process.env.API_KEY)
  config.api.headers['x-api-key'] = config.apiKey
  return config
}
