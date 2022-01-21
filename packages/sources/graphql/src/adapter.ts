import {
  AdapterRequest,
  APIEndpoint,
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
} from '@chainlink/types'
import { makeConfig } from './config'
import { Builder } from '@chainlink/ea-bootstrap'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint<Config> =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
