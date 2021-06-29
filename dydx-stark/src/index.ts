import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'dydx_stark'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
