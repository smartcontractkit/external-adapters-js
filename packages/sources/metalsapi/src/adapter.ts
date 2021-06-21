import { Builder } from '@chainlink/ea-bootstrap'
import { Config, AdapterRequest, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig } from './config'
import { convert } from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const chainlinkEndpoints = [convert]
  return Builder.buildSelector(request, config, chainlinkEndpoints)
}

export const makeExecute: ExecuteFactory<Config> = (config?: Config) => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
