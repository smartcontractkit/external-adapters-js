import { makeConfig } from './config'
import { makeExecute } from './adapter'
import { expose } from '@chainlink/ea-bootstrap'

const NAME = 'BOB'
export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
