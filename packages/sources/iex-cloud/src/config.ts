import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const NAME = 'IEXCloud'

export const DEFAULT_ENDPOINT = 'stock'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || 'https://cloud.iexapis.com/stable'
  return config
}
