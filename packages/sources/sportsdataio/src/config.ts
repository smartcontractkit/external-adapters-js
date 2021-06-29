import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as ChainlinkConfig } from '@chainlink/types'

export const NAME = 'SPORTSDATAIO'

export const DEFAULT_SPORT = 'nfl'
export const DEFAULT_ENDPOINT = 'scores'
export const DEFAULT_BASE_URL = 'https://fly.sportsdata.io/v3'

export const ENV_NFL_SCORES_API_KEY = 'NFL_SCORES_API_KEY'
export const ENV_MMA_SCORES_API_KEY = 'MMA_SCORES_API_KEY'
export const ENV_MMA_STATS_API_KEY = 'MMA_STATS_API_KEY'
export const ENV_CFB_SCORES_API_KEY = 'CFB_SCORES_API_KEY'

export type Config = ChainlinkConfig & {
  nflScoresKey?: string
  mmaScoresKey?: string
  mmaStatsKey?: string
  cfbScoresKey?: string
}

export const makeConfig = (prefix?: string): Config => {
  const config: Config = {
    ...Requester.getDefaultConfig(prefix),
    nflScoresKey: util.getEnv(ENV_NFL_SCORES_API_KEY, prefix),
    mmaScoresKey: util.getEnv(ENV_MMA_SCORES_API_KEY, prefix),
    mmaStatsKey: util.getEnv(ENV_MMA_STATS_API_KEY, prefix),
    cfbScoresKey: util.getEnv(ENV_CFB_SCORES_API_KEY, prefix)
  }
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL

  return config
}
