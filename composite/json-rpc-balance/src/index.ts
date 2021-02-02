import { expose, util } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'
import { makeExecute } from './adapter'

const NAME = 'JsonRpcBalance'

export = { NAME, makeExecute, makeConfig, ...expose(util.wrapExecute(makeExecute())) }
