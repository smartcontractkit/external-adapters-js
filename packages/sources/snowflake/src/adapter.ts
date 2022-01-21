import { Builder } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, ExecuteFactory, AdapterRequest, APIEndpoint } from '@chainlink/types'
import { makeConfig, SnowflakeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<SnowflakeConfig> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint<SnowflakeConfig> =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<SnowflakeConfig> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
