import { expose, util } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'CRYPTOAPIS'
const handlers = expose(util.wrapExecute(makeExecute()))
export { NAME, makeExecute, makeConfig, handlers }
