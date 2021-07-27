import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { NAME, makeConfig } from './config'

export = { makeExecute, makeConfig, ...expose(NAME, makeExecute()) }
