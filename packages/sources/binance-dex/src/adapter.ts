import { Requester } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig } from './config'
import { price } from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  Requester.logConfig(config)
  return await price.execute(request, context, config)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
