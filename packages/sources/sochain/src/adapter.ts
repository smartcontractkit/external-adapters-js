import { Builder } from '@chainlink/ea-bootstrap'
import { ExecuteFactory, ExecuteWithConfig, Config } from '@chainlink/types'
import { makeConfig } from './config'
import { balance } from './endpoint'

// Export function to integrate with Chainlink node
export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const chainlinkEndpoints = [balance]
  return Builder.buildSelector(request, config, chainlinkEndpoints)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
