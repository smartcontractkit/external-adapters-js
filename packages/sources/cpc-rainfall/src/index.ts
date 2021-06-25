import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, CALLBACK_PROPERTIES } from './adapter'
import { makeConfig, NAME } from './config'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute(), undefined, CALLBACK_PROPERTIES) }
