import { Builder } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig } from './config'
import { sendPayout, getPayout } from './endpoint'

// const inputParams = {
//   endpoint: false,
// }

// const paramOptions = {
//   endpoint: [sendPayout.NAME, getPayout.NAME, 'read', 'write'],
// }

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const chainlinkEndpoints = [sendPayout, getPayout]
  return Builder.buildSelector(request, config, chainlinkEndpoints)
}

export const makeExecute: ExecuteFactory<Config> = config => {
  return async request => execute(request, config || makeConfig())
}
