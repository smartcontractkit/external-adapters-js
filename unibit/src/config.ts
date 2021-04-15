import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const NAME = 'UNIBIT'

export const DEFAULT_ENDPOINT = 'historical'
export const DEFAULT_URL = 'https://api.unibit.ai/v2/stock/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.baseURL = config.api.baseURL || DEFAULT_URL
  return config
}
