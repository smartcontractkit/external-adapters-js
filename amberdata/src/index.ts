import { expose, commonAdapter } from '@chainlink/ea-bootstrap'
import { Endpoints } from './endpoint'
import { makeConfig } from './config'
import { ExecuteFactory, Config } from '@chainlink/types'

const NAME = 'AMBERDATA'

const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => commonAdapter.execute(request, config || makeConfig(), Endpoints)
}

export = { NAME, makeConfig, makeExecute, ...expose(makeExecute()) }
