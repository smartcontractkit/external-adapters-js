import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

const NAME = 'IEX Cloud'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
