import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, endpointSelector } from './adapter'
import { makeConfig, NAME } from './config'

export = { NAME, makeExecute, makeConfig, ...expose(makeExecute(), undefined, endpointSelector) }
