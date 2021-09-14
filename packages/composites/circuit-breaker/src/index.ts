import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'CIRCUIT_BREAKER'

export = { NAME, makeConfig, makeExecute, ...expose(NAME, makeExecute()) }
