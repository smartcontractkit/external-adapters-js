import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'MOCK_EA'

export const DEFAULT_ENDPOINT = 'price'
export const DEFAULT_UPDATE_INTERVAL_IN_MS = 300000
export const DEFAULT_DEVIATION_AMOUNT = 5
export const DEFAULT_MIN = 1000

export interface ExtendedConfig extends Config {
  updateIntervalInMS: number
  deviationAmount: number
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const updateIntervalInMS = util.getEnv('UPDATE_INTERVAL_IN_MS', prefix)
  const deviationAmount = util.getEnv('DEVIATION_AMOUNT', prefix)
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    updateIntervalInMS: updateIntervalInMS
      ? parseInt(updateIntervalInMS)
      : DEFAULT_UPDATE_INTERVAL_IN_MS,
    deviationAmount: deviationAmount ? parseInt(deviationAmount) : DEFAULT_DEVIATION_AMOUNT,
  }
}
