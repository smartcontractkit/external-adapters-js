import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'
import * as types from './types'

const NAME = 'Token-Allocation'
const handlers = expose(makeExecute())

export { NAME, types, makeExecute, makeConfig, handlers }
