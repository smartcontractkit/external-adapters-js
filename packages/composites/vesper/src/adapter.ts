import { Builder } from '@chainlink/ea-bootstrap'
import * as TA from '@chainlink/token-allocation-adapter'
import type { ExecuteWithConfig, ExecuteFactory } from '@chainlink/ea-bootstrap'
import { makeConfig, Config } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config, endpoints.TInputParameters> = async (
  request,
  context,
  config,
) => {
  return Builder.buildSelector<Config, endpoints.TInputParameters>(
    request,
    context,
    config,
    endpoints,
  )
}

export const endpointSelector = TA.makeEndpointSelector(makeConfig, endpoints as any, 'price')
// TODO: composite endpoint types

export const makeExecute: ExecuteFactory<Config, endpoints.TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
