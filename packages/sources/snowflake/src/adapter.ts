import { Builder } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
} from '@chainlink/ea-bootstrap'
import { makeConfig, SnowflakeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<SnowflakeConfig, endpoints.TInputParameters> = async (
  request,
  context,
  config,
) => {
  return Builder.buildSelector<SnowflakeConfig, endpoints.TInputParameters>(
    request,
    context,
    config,
    endpoints,
  )
}

export const endpointSelector = (
  request: AdapterRequest,
): APIEndpoint<SnowflakeConfig, endpoints.TInputParameters> =>
  Builder.selectEndpoint<SnowflakeConfig, endpoints.TInputParameters>(
    request,
    makeConfig(),
    endpoints,
  )

export const makeExecute: ExecuteFactory<SnowflakeConfig, endpoints.TInputParameters> = (
  config,
) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
