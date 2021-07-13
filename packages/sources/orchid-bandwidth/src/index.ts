import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { makeConfig, NAME } from './config'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute()) }
