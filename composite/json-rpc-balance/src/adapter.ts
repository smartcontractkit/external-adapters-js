import { balance } from '@chainlink/ea-factories'
import { makeConfig } from './config'
import { ExecuteFactory } from '@chainlink/types'

export const makeExecute: ExecuteFactory<balance.BalanceConfig> = (config) => {
  return balance.make(config || makeConfig())
}
