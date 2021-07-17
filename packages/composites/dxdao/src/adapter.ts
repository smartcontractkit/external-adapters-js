import { ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig, Config } from './config'
import { tvl } from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  return await tvl.execute(request, config)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
