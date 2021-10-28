import { expose } from '@chainlink/ea-bootstrap'
import { endpointSelector, makeExecute } from './adapter'
import { NAME, makeConfig } from './config'

export = { makeExecute, makeConfig, ...expose(NAME, makeExecute(), undefined, endpointSelector) }
