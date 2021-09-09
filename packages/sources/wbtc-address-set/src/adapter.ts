import { ExecuteWithConfig, ExecuteFactory, AdapterRequest, APIEndpoint } from '@chainlink/types'
import { makeConfig, Config } from './config'
import * as endpoints from './endpoint'
import { Builder } from '@chainlink/ea-bootstrap'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint<Config> =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
