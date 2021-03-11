import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute } from './adapter'

export = { makeExecute, ...expose(makeExecute()) }
