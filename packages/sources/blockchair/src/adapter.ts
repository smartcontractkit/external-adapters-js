import { Builder } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { makeConfig } from './config'
import { stats, balance } from './endpoint'

// Export function to integrate with Chainlink node
const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const chainlinkEndpoints = [balance, stats]
  return Builder.buildSelector(request, config, chainlinkEndpoints)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
