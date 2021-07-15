import { Builder } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteFactory,
  ExecuteWithConfig,
  AdapterRequest,
  APIEndpoint,
} from '@chainlink/types'
import { makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  return Builder.buildSelector(request, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
