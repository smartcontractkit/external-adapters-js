import { Builder } from '@chainlink/ea-bootstrap'
import { AdapterRequest, APIEndpoint, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { ExtendedConfig, makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint<ExtendedConfig> =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<ExtendedConfig> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
