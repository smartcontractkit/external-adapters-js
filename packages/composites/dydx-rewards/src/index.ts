import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'DYDX_REWARDS'

export = { NAME, makeConfig, makeExecute, ...expose(makeExecute()) }
