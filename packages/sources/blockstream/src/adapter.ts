import { Builder } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { makeConfig } from './config'
import { blocks } from './endpoint'



export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const chainlinkEndpoints = [blocks]
  return Builder.buildSelector(request, config, chainlinkEndpoints)
}


export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
