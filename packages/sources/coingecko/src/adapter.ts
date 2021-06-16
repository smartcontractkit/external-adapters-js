import { Builder } from '@chainlink/ea-bootstrap'
import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { makeConfig } from './config'
import { global, price, coins } from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const chainlinkEndpoints = [global, price, coins]
  return Builder.buildSelector(request, config, chainlinkEndpoints)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
