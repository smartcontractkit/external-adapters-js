import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig, NAME } from './config'

export = { NAME, makeConfig, makeExecute, ...expose(makeExecute()) }
