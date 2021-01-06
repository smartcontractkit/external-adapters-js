import { util } from '@chainlink/ea-bootstrap'
import types from '@chainlink/types'
import { getSourceDataProviders, SourceDataProvider } from './source'
import { CheckDataProvider, getCheckDataProviders } from './check'

export type Config = types.Config & {
  sourceDataProviders: SourceDataProvider[]
  checkDataProviders: CheckDataProvider[]
  threshold: {
    checks: number
    onchain: number
  }
}

export const ENV_CHECK_THRESHOLD = 'CHECK_THRESHOLD'
export const ENV_ONCHAIN_THRESHOLD = 'ONCHAIN_THRESHOLD'

export const makeConfig = (prefix = ''): Config => {
  return {
    sourceDataProviders: getSourceDataProviders(prefix),
    checkDataProviders: getCheckDataProviders(prefix),
    threshold: {
      checks: Number(util.getEnv(ENV_CHECK_THRESHOLD, prefix) || 0),
      onchain: Number(util.getEnv(ENV_ONCHAIN_THRESHOLD, prefix) || 0),
    },
  }
}
