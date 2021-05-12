import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'territoryAnalyzer'
export const DEFAULT_BASE_URL = 'https://api.prospectnow.com/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  return config
}
