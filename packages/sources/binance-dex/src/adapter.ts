import { Requester } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig } from './config'
import { price } from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  Requester.logConfig(config)
  return await price.execute(request, config)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
