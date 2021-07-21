import { Builder } from '@chainlink/ea-bootstrap'
import { ExecuteFactory, ExecuteWithConfig, Config } from '@chainlink/types'
import { makeConfig } from './config'
import * as endpoints from './endpoint'

// Export function to integrate with Chainlink node
export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
