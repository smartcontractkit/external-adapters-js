import { Builder } from '@chainlink/ea-bootstrap'
import { AdapterRequest } from '@chainlink/types'
import { APIEndpoint, Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import * as endpoints from './endpoint'
import { makeConfig } from './config'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint<Config> =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
