import { expose, util } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

export = { makeExecute, makeConfig, ...expose(util.wrapExecute(makeExecute())) }
