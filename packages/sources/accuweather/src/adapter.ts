import { Builder } from '@chainlink/ea-bootstrap'
import {
  DefaultConfig,
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
} from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<DefaultConfig, endpoints.TInputParameters> = async (
  request,
  context,
  config,
) => {
  return Builder.buildSelector<DefaultConfig, endpoints.TInputParameters>(
    request,
    context,
    config,
    endpoints,
  )
}

export const endpointSelector = (
  request: AdapterRequest,
): APIEndpoint<DefaultConfig, endpoints.TInputParameters> =>
  Builder.selectEndpoint<DefaultConfig, endpoints.TInputParameters>(
    request,
    makeConfig(),
    endpoints,
  )

export const makeExecute: ExecuteFactory<DefaultConfig, endpoints.TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
