import { expose, util } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'
import * as types from './types'

const NAME = 'Token-Allocation'
const handlers = expose(util.wrapExecute(makeExecute()))

export { NAME, types, makeExecute, makeConfig, handlers }
