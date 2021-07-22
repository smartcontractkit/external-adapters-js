import { expose } from '@chainlink/ea-bootstrap'
import { makeConfig, NAME } from './config'
import { endpointSelector, makeExecute } from './adapter'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute(), undefined, endpointSelector) }
