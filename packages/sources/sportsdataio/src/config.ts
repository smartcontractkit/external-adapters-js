import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as ChainlinkConfig } from '@chainlink/types'

export const NAME = 'SPORTSDATAIO'

export const DEFAULT_SPORT = 'nfl'
export const DEFAULT_ENDPOINT = 'scores'
export const DEFAULT_BASE_URL = 'https://fly.sportsdata.io/v3'

export type Config = ChainlinkConfig & {
  nflScoresKey?: string
  mmaScoresKey?: string
}

export const makeConfig = (prefix?: string): Config => {
  const config: Config = {
    ...Requester.getDefaultConfig(prefix),
    nflScoresKey: util.getEnv('NFL_SCORES_API_KEY', prefix),
    mmaScoresKey: util.getEnv('MMA_SCORES_API_KEY', prefix)
  }
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL

  return config
}
