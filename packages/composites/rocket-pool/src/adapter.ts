import { APIEndpoint, Builder, ExecuteFactory, ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeConfig, RocketPoolConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<RocketPoolConfig, endpoints.TInputParameters> = async (
  request,
  context,
  config,
) =>
  Builder.buildSelector<RocketPoolConfig, endpoints.TInputParameters>(
    request,
    context,
    config,
    endpoints,
  )

export const endpointSelector = (
  request: AdapterRequest,
): APIEndpoint<RocketPoolConfig, endpoints.TInputParameters> =>
  Builder.selectEndpoint<RocketPoolConfig, endpoints.TInputParameters>(
    request,
    makeConfig(),
    endpoints,
  )

export const makeExecute: ExecuteFactory<RocketPoolConfig, endpoints.TInputParameters> = (
  config,
) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
