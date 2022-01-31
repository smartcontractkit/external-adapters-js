import { AdapterRequest, ExecuteWithConfig, APIEndpoint, ExecuteFactory } from '@chainlink/types'
import { makeConfig, Config as AdapterConfig } from './config'
import * as endpoints from './endpoint'
import { Builder } from '@chainlink/ea-bootstrap'

export const execute: ExecuteWithConfig<AdapterConfig> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint<AdapterConfig> =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<AdapterConfig> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
