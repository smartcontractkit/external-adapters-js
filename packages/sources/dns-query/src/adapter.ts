import {
  AdapterRequest,
  APIEndpoint,
  Config,
  ExecuteFactory,
  ExecuteWithConfig,
} from '@chainlink/types'
import { Builder } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) =>
  Builder.buildSelector(request, context, config, endpoints)

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config?: Config) => (input, context) =>
  execute(input, context, config || makeConfig())
