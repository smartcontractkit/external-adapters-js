import { Builder } from '@chainlink/ea-bootstrap'
import {
  ExecuteWithConfig,
  ExecuteFactory,
  AdapterRequest,
  APIEndpoint,
} from '@chainlink/ea-bootstrap'
import { EthBeaconConfig, makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<EthBeaconConfig, endpoints.TInputParameters> = async (
  request,
  context,
  config,
) => {
  return Builder.buildSelector<EthBeaconConfig, endpoints.TInputParameters>(
    request,
    context,
    config,
    endpoints,
  )
}

export const endpointSelector = (
  request: AdapterRequest,
): APIEndpoint<EthBeaconConfig, endpoints.TInputParameters> =>
  Builder.selectEndpoint<EthBeaconConfig, endpoints.TInputParameters>(
    request,
    makeConfig(),
    endpoints,
  )

export const makeExecute: ExecuteFactory<EthBeaconConfig, endpoints.TInputParameters> = (
  config,
) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
