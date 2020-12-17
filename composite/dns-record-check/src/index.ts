import { expose, util } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'

export = { makeExecute, ...expose(util.wrapExecute(makeExecute())) }
