import {
  AdapterRequest,
  APIEndpoint,
  Config,
  ExecuteFactory,
  ExecuteWithConfig,
} from '@chainlink/ea-bootstrap'
import { Builder } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config, endpoints.TInputParameters> = async (
  request,
  context,
  config,
) => Builder.buildSelector<Config, endpoints.TInputParameters>(request, context, config, endpoints)

export const endpointSelector = (
  request: AdapterRequest,
): APIEndpoint<Config, endpoints.TInputParameters> =>
  Builder.selectEndpoint<Config, endpoints.TInputParameters>(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config, endpoints.TInputParameters> =
  (config?: Config) => (input, context) =>
    execute(input, context, config || makeConfig())
