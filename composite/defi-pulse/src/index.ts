import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig } from './config'

export = { makeExecute, makeConfig, ...expose(makeExecute()) }
