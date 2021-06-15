import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'LINEAR_FINANCE'

export = { NAME, makeConfig, makeExecute, ...expose(makeExecute()) }
