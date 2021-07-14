import { expose } from '@chainlink/ea-bootstrap'
import { makeExecute, endpointSelector } from './adapter'
import { makeConfig, NAME } from './config'

export = { NAME, makeConfig, makeExecute, ...expose(makeExecute(), undefined, endpointSelector) }
