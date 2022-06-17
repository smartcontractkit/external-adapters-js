import {
  AdapterRequest,
  ExecuteWithConfig,
  APIEndpoint,
  ExecuteFactory,
} from '@chainlink/ea-bootstrap'
import { makeConfig, Config } from './config'
import * as endpoints from './endpoint'
import { Builder } from '@chainlink/ea-bootstrap'
import { TInputParameters } from './utils'

export const execute: ExecuteWithConfig<Config, TInputParameters> = async (
  request,
  context,
  config,
) => {
  return Builder.buildSelector<Config, TInputParameters>(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint<Config, TInputParameters> =>
  Builder.selectEndpoint<Config, TInputParameters>(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config, TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
