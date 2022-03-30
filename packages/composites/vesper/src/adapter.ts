import { Builder } from '@chainlink/ea-bootstrap'
import * as TA from '@chainlink/token-allocation-adapter'
import type { ExecuteWithConfig, ExecuteFactory } from '@chainlink/ea-bootstrap'
import { makeConfig, Config } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = TA.makeEndpointSelector(makeConfig, endpoints, 'price')

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
