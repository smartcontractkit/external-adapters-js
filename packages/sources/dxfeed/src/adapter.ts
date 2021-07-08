import { Builder } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { makeConfig } from './config'
import * as endpoints from './endpoint'


export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  return Builder.buildSelector(request, config, endpoints)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
