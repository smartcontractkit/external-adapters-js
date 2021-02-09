import { expose, commonAdapter } from '@chainlink/ea-bootstrap'
import { ENDPOINTS } from './endpoint'
import { makeConfig } from './config'
import { ExecuteFactory, Config } from '@chainlink/types'

const NAME = 'EXAMPLE'

const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => commonAdapter.execute(request, config || makeConfig(), ENDPOINTS)
}

export = { NAME, makeConfig, makeExecute, ...expose(makeExecute()) }
