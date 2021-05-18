import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'SPORTSDATAIO' // This should be filled in with a name corresponding to the data provider using UPPERCASE and _underscores_.

export const DEFAULT_SPORT = 'mma'
export const DEFAULT_ENDPOINT = 'scores'
export const DEFAULT_BASE_URL = 'https://fly.sportsdata.io/v3'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.api.headers['Ocp-Apim-Subscription-Key'] = config.apiKey
  return config
}
