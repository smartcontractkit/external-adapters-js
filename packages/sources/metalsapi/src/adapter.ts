import { Builder } from '@chainlink/ea-bootstrap'
import { Config, AdapterRequest, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  return Builder.buildSelector(request, config, endpoints)
}

export const makeExecute: ExecuteFactory<Config> = (config?: Config) => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
