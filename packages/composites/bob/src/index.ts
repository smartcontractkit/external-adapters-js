import { makeExecute } from './adapter'
import { expose } from '@chainlink/ea-bootstrap'

const NAME = 'BOB'
export = { NAME, makeExecute, ...expose(makeExecute()) }
