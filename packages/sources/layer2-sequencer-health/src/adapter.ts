import { Builder, Logger } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
} from '@chainlink/ea-bootstrap'
import { ExtendedConfig, HEALTH_ENDPOINTS, makeConfig, Networks } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<ExtendedConfig, endpoints.TInputParameters> = async (
  request,
  context,
  config,
) => {
  return Builder.buildSelector<ExtendedConfig, endpoints.TInputParameters>(
    request,
    context,
    config,
    endpoints,
  )
}

export const endpointSelector = (
  request: AdapterRequest,
): APIEndpoint<ExtendedConfig, endpoints.TInputParameters> =>
  Builder.selectEndpoint<ExtendedConfig, endpoints.TInputParameters>(
    request,
    makeConfig(),
    endpoints,
  )

export const makeExecute: ExecuteFactory<ExtendedConfig, endpoints.TInputParameters> = (config) => {
  // Disclaimer on startup
  Object.keys(HEALTH_ENDPOINTS).forEach((network) => {
    if (!HEALTH_ENDPOINTS[network as Networks]?.endpoint)
      Logger.info(`[${network}] Health endpoint not available for network: ${network}`)
  })
  return async (request, context) => execute(request, context, config || makeConfig())
}
