import { expose, commonAdapter } from '@chainlink/ea-bootstrap'
import { ENDPOINTS } from './endpoint'
import { makeConfig, DEFAULT_ENDPOINT } from './config'
import { ExecuteFactory, Config } from '@chainlink/types'

const NAME = 'AMBERDATA'

const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) =>
    commonAdapter.execute(request, config || makeConfig(), ENDPOINTS, DEFAULT_ENDPOINT)
}

export = { NAME, makeConfig, makeExecute, ...expose(makeExecute()) }
