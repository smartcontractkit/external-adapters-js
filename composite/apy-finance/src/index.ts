import { expose, util } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'APY-Finance'

export = { NAME, makeConfig, makeExecute, ...expose(util.wrapExecute(makeExecute())) }
