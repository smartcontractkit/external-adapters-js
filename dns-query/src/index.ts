import { expose, util } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'
export * as types from './types'

const NAME = 'DNS-Query'
//TODO: can this be handled better? Are exposed handler types available?
const handlers = expose(util.wrapExecute(makeExecute()))
export { NAME, makeConfig, makeExecute, handlers }
