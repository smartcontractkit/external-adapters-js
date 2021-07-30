import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'
import { NAME } from './config'

export = { makeExecute, ...expose(NAME, makeExecute()) }
