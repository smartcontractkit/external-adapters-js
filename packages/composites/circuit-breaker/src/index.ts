import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'CIRCUIT_BREAKER'
const handlers = expose(NAME, makeExecute())

export { NAME, makeConfig, makeExecute, handlers }
